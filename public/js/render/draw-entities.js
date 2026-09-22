function drawObstacle(ctx, entity) {
  ctx.save();
  ctx.translate(entity.x, entity.y);
  ctx.shadowColor = "rgba(63, 43, 43, 0.2)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  if (entity.variant === "pot") {
    ctx.fillStyle = "#d76c58";
    ctx.fillRect(8, 15, entity.width - 16, entity.height - 15);
    ctx.fillStyle = "#68a85d";
    ctx.beginPath();
    ctx.arc(entity.width / 2, 0, 26, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.variant === "fence") {
    ctx.fillStyle = "#b87842";
    ctx.fillRect(0, entity.height - 12, entity.width, 12);
    ctx.fillRect(12, 0, 14, entity.height);
    ctx.fillRect(entity.width - 26, 0, 14, entity.height);
  } else if (entity.variant === "yarn") {
    ctx.fillStyle = "#bf76c8";
    ctx.beginPath();
    ctx.arc(entity.width / 2, entity.height / 2, Math.min(entity.width, entity.height) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7a4c89";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(entity.width / 2, entity.height / 2, 18, 0, Math.PI * 1.5);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#c18a58";
    ctx.fillRect(0, 8, entity.width, entity.height - 8);
    ctx.strokeStyle = "#8f5c3b";
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 12, entity.width - 8, entity.height - 16);
    ctx.beginPath();
    ctx.moveTo(entity.width / 2, 12);
    ctx.lineTo(entity.width / 2, entity.height - 4);
    ctx.stroke();
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 250, 245, 0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.lineTo(Math.max(8, entity.width - 8), 8);
  ctx.stroke();
  ctx.restore();
}

function drawMouse(ctx, entity) {
  ctx.save();
  ctx.translate(entity.x, entity.y);
  ctx.shadowColor = "rgba(63, 43, 43, 0.2)";
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "#9c6b55";
  ctx.beginPath();
  ctx.ellipse(entity.width / 2, entity.height / 2 + 5, entity.width / 2 - 4, entity.height / 2 - 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d99191";
  ctx.beginPath();
  ctx.arc(entity.width * 0.3, entity.height * 0.2, 9, 0, Math.PI * 2);
  ctx.arc(entity.width * 0.7, entity.height * 0.2, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff4dc";
  ctx.beginPath();
  ctx.arc(entity.width * 0.38, entity.height * 0.52, 3, 0, Math.PI * 2);
  ctx.arc(entity.width * 0.62, entity.height * 0.52, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d99191";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(entity.width, entity.height * 0.65);
  ctx.quadraticCurveTo(entity.width + 22, entity.height * 0.3, entity.width + 5, 0);
  ctx.stroke();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 244, 220, 0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(entity.width * 0.38, entity.height * 0.52, 7, Math.PI, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();
}

function drawGrass(ctx, entity) {
  ctx.save();
  ctx.translate(entity.x, entity.y);
  ctx.shadowColor = "rgba(63, 43, 43, 0.16)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.strokeStyle = "#4c9b58";
  ctx.lineWidth = 8;
  for (let index = 0; index < 5; index += 1) {
    ctx.beginPath();
    ctx.moveTo(entity.width / 2, entity.height);
    ctx.quadraticCurveTo(
      entity.width * (0.15 + index * 0.18),
      entity.height * 0.45,
      entity.width * (0.05 + index * 0.22),
      0,
    );
    ctx.stroke();
  }
  ctx.fillStyle = "#f4cf6a";
  ctx.beginPath();
  ctx.ellipse(entity.width / 2, entity.height, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 250, 245, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(entity.width / 2, entity.height - 2, 15, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export { drawGrass, drawMouse, drawObstacle };
