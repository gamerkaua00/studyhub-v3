// StudyHub v3 — routes/holidayRoutes.js
const express = require("express");
const router  = express.Router();
const Holiday = require("../models/Holiday");
const { requireAuth } = require("../middleware/auth");

// Feriados nacionais e do Paraná pré-cadastrados para 2026
const DEFAULT_HOLIDAYS_2026 = [
  { name: "Confraternização Universal",  date: "2026-01-01", type: "nacional",  recurring: true  },
  { name: "Carnaval",                    date: "2026-02-16", type: "nacional",  recurring: false },
  { name: "Carnaval",                    date: "2026-02-17", type: "nacional",  recurring: false },
  { name: "Sexta-feira Santa",           date: "2026-04-03", type: "nacional",  recurring: false },
  { name: "Tiradentes",                  date: "2026-04-21", type: "nacional",  recurring: true  },
  { name: "Dia do Trabalho",             date: "2026-05-01", type: "nacional",  recurring: true  },
  { name: "Corpus Christi",              date: "2026-06-04", type: "nacional",  recurring: false },
  { name: "Independência do Brasil",     date: "2026-09-07", type: "nacional",  recurring: true  },
  { name: "Nossa Sra. Aparecida",        date: "2026-10-12", type: "nacional",  recurring: true  },
  { name: "Finados",                     date: "2026-11-02", type: "nacional",  recurring: true  },
  { name: "Proclamação da República",    date: "2026-11-15", type: "nacional",  recurring: true  },
  { name: "Natal",                       date: "2026-12-25", type: "nacional",  recurring: true  },
  { name: "Emancipação do Paraná",       date: "2026-12-19", type: "estadual",  recurring: true  },
  { name: "Aniversário de Curitiba",     date: "2026-03-29", type: "municipal", recurring: true  },
];

// Seed feriados padrão se não existirem
const seedHolidays = async () => {
  const count = await Holiday.countDocuments();
  if (count === 0) {
    await Holiday.insertMany(DEFAULT_HOLIDAYS_2026);
    console.log("[Holidays] Feriados padrão 2026 inseridos");
  }
};
seedHolidays().catch(console.error);

// GET /api/holidays?month=4&year=2026
router.get("/", async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = {};
    if (month && year) {
      const m = String(month).padStart(2, "0");
      filter.date = { $gte: `${year}-${m}-01`, $lte: `${year}-${m}-31` };
    }
    const holidays = await Holiday.find(filter).sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/holidays/all - sem filtro, para o calendário anual
router.get("/all", async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST, PUT, DELETE requerem auth
router.post("/", requireAuth, async (req, res) => {
  try {
    const h = new Holiday(req.body);
    await h.save();
    res.status(201).json({ success: true, data: h });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const h = await Holiday.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ success: true, data: h });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
