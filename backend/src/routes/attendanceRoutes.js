// StudyHub v3.1.1 — routes/attendanceRoutes.js — CORRIGIDO
const express    = require("express");
const router     = express.Router();
const Attendance = require("../models/Attendance");
const { requireAuth } = require("../middleware/auth");
const { sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

// Envia painel no Discord — com log e tratamento de erro explícito
const sendAttendancePanel = async (attendance) => {
  const channelName = attendance.discordChannel;
  if (!channelName) {
    console.warn(`[Attendance] Canal não definido para: ${attendance.subject}`);
    return null;
  }

  const schedules = (attendance.schedules?.length > 0)
    ? attendance.schedules
    : [{ days: attendance.days || [], startTime: attendance.startTime || "08:00", endTime: attendance.endTime || "10:00", room: attendance.room || "", notes: attendance.notes || "" }];

  const scheduleFields = schedules.map((s, i) => {
    const days  = Array.isArray(s.days) && s.days.length > 0 ? s.days.join(", ") : "A definir";
    const label = schedules.length > 1 ? `📅 Horário ${i + 1}` : "📅 Horário";
    let val = `**${days}** — ${s.startTime} às ${s.endTime}`;
    if (s.room)  val += `\n🏫 ${s.room}`;
    if (s.notes) val += `\n📝 ${s.notes}`;
    return { name: label, value: val, inline: schedules.length > 1 };
  });

  const embed = {
    title: `📋 Atendimento — ${attendance.subject}`,
    description: "Horários disponíveis para tirar dúvidas.",
    color: 0x1ABC9C,
    fields: [
      { name: "👨‍🏫 Professor", value: attendance.teacher || "—", inline: false },
      ...scheduleFields,
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub v3.1.1 • Atualizado automaticamente" },
  };

  const result = await sendDiscordNotification(channelName, "", embed);
  if (result) {
    console.log(`[Attendance] ✅ Painel enviado em #${channelName}`);
  } else {
    console.warn(`[Attendance] ⚠️ Canal #${channelName} não encontrado no Discord`);
  }
  return result;
};

router.get("/", async (req, res) => {
  try {
    const list = await Attendance.find({ active: true }).sort({ subject: 1 });
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    // Gera nome do canal baseado na matéria
    const channelName = (req.body.subject || "")
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!channelName) {
      return res.status(400).json({ success: false, message: "Nome da matéria inválido" });
    }

    const attendance = new Attendance({ ...req.body, discordChannel: channelName });
    await attendance.save();
    console.log(`[Attendance] ✅ Criado: ${attendance.subject} → #${channelName}`);

    // Avisa no admin-bot
    await sendDiscordNotification("admin-bot", "", {
      title: "🏫 Novo Atendimento Cadastrado",
      description: `Matéria: **${req.body.subject}** | Professor: **${req.body.teacher}**\nCanal: **#${channelName}** (será criado no próximo restart do bot)`,
      color: 0x1ABC9C,
      timestamp: new Date().toISOString(),
    });

    // Tenta enviar painel (canal pode já existir)
    await sendAttendancePanel(attendance);

    res.status(201).json({ success: true, data: attendance });
  } catch (e) {
    console.error("[Attendance] Erro ao criar:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    // CRÍTICO: nunca sobrescreve discordChannel no update
    const updateData = { ...req.body };
    delete updateData.discordChannel; // canal não muda ao editar
    delete updateData._id;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );
    if (!attendance) return res.status(404).json({ success: false, message: "Atendimento não encontrado" });

    console.log(`[Attendance] ✅ Atualizado: ${attendance.subject}`);

    // Envia painel atualizado
    await sendAttendancePanel(attendance);

    res.json({ success: true, data: attendance });
  } catch (e) {
    console.error("[Attendance] Erro ao atualizar:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Attendance.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
