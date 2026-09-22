function createNicknameScreen(onSaved, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const documentRef = options.documentRef || globalThis.document;
  let root = null;
  let errorElement = null;

  function showError(message) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }
  }

  async function submit(event, input) {
    event.preventDefault?.();
    const nickname = input.value.trim();
    if (!nickname) {
      showError("닉네임을 입력해주세요.");
      return;
    }
    errorElement.hidden = true;
    try {
      const response = await fetchFn("/api/me/nickname", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nickname }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.user) {
        showError("닉네임을 저장하지 못했습니다. 다시 시도해주세요.");
        return;
      }
      onSaved?.(payload.user);
    } catch {
      showError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  function mount(nextRoot, user = null) {
    root = nextRoot;
    if (!root || !documentRef?.createElement) {
      return null;
    }
    root.replaceChildren();
    root.hidden = false;
    const section = documentRef.createElement("section");
    section.className = "flow-card nickname-screen";
    const heading = documentRef.createElement("h1");
    heading.textContent = "고양이 이름을 정해주세요";
    const intro = documentRef.createElement("p");
    intro.textContent = "리더보드에 표시될 이름입니다. 중복 이름도 사용할 수 있어요.";
    const email = documentRef.createElement("small");
    email.textContent = user?.email ? "로그인 계정: " + user.email : "";
    const form = documentRef.createElement("form");
    form.className = "nickname-form";
    const input = documentRef.createElement("input");
    input.type = "text";
    input.name = "nickname";
    input.autocomplete = "nickname";
    input.placeholder = "예: 치즈냥";
    input.maxLength = 80;
    const submitButton = documentRef.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "game-button primary";
    submitButton.textContent = "저장하고 시작하기";
    errorElement = documentRef.createElement("p");
    errorElement.className = "form-error";
    errorElement.hidden = true;
    form.addEventListener("submit", (event) => submit(event, input));
    form.append(input, submitButton, errorElement);
    section.append(heading, intro, email, form);
    root.append(section);
    input.focus?.();
    return section;
  }

  return { mount };
}

export { createNicknameScreen };
