
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import { randomUUID } from "node:crypto";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

type TransactionType = "income" | "expense";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note?: string;
}

const transactionSchema = new Schema<Transaction>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

const TransactionModel = mongoose.model<Transaction>(
  "Transaction",
  transactionSchema,
);

function validTransaction(body: any): boolean {
  return (
    typeof body.title === "string" &&
    !!body.title.trim() &&
    typeof body.amount === "number" &&
    Number.isFinite(body.amount) &&
    body.amount > 0 &&
    ["income", "expense"].includes(body.type) &&
    typeof body.category === "string" &&
    !!body.category.trim() &&
    typeof body.date === "string" &&
    !!body.date.trim() &&
    (body.note === undefined || typeof body.note === "string")
  );
}

function toTransaction(doc: any): Transaction {
  return {
    id: doc.id,
    title: doc.title,
    amount: doc.amount,
    type: doc.type,
    category: doc.category,
    date: doc.date,
    ...(doc.note !== undefined ? { note: doc.note } : {}),
  };
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Luma Wallet API is running!",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Get all transactions
app.get("/api/transactions", async (_req, res) => {
  try {
    const transactions = await TransactionModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: transactions.length,
      data: transactions.map(toTransaction),
    });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch transactions.",
    });
  }
});

// Add a transaction
app.post("/api/transactions", async (req, res) => {
  if (!validTransaction(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Provide a title, positive numeric amount, valid type, category, and date.",
    });
  }

  try {
    const transaction = await TransactionModel.create({
      id: randomUUID(),
      title: req.body.title.trim(),
      amount: req.body.amount,
      type: req.body.type,
      category: req.body.category.trim(),
      date: req.body.date,
      ...(typeof req.body.note === "string"
        ? { note: req.body.note.trim() }
        : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully!",
      data: toTransaction(transaction),
    });
  } catch (error) {
    console.error("Add transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save transaction.",
    });
  }
});

// Update a transaction
app.put("/api/transactions/:id", async (req, res) => {
  if (!validTransaction(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid transaction details.",
    });
  }

  try {
    const updated = await TransactionModel.findOneAndUpdate(
      { id: req.params.id },
      {
        title: req.body.title.trim(),
        amount: req.body.amount,
        type: req.body.type,
        category: req.body.category.trim(),
        date: req.body.date,
        note: typeof req.body.note === "string" ? req.body.note.trim() : "",
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.json({
      success: true,
      message: "Transaction updated successfully!",
      data: toTransaction(updated),
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update transaction.",
    });
  }
});

// Delete a transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const deleted = await TransactionModel.findOneAndDelete({
      id: req.params.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.json({
      success: true,
      message: "Transaction deleted successfully!",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete transaction.",
    });
  }
});

// Connect to MongoDB, then start the API
async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI is missing. Check backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB Atlas connected successfully!");

    app.listen(PORT, () => {
      console.log(`Luma Wallet API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

void startServer();
