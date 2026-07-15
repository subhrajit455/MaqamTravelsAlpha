// scripts/seed-packages.js
//
// Minimal seed data for Postman testing of the package module.
// Run once: node scripts/seed-packages.js
// Safe to re-run — checks for existing docs before creating, won't duplicate.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../modules/auth/auth.model"); // ⚠️ adjust path if different
const TicketStock = require("../modules/packages/ticketStock.model");
const HotelStock = require("../modules/packages/hotelStock.model");
const Package = require("../modules/packages/package.model");

const seed = async () => {
  const conn = await mongoose.connect("mongodb+srv://vaisdt81_db_user:i4ql55C2HqowIvnh@cluster0.wow0gmh.mongodb.net/?appName=Cluster0");
  console.log("Connected.");

  // ── 1. Admin — reuse one if it already exists, else create ──
  let admin = await User.findOne({ role: { $in: ["admin", "super_admin"] } });
  if (!admin) {
    admin = await User.create({
      firstName: "Seed ",
      lastName: "Admin",
      phone: "9999999999",
      password: "Password123!", // relies on User's pre-save hashing hook, if implemented
      role: "super_admin",
    });
    console.log("Created admin — login with phone 9999999999 / Password123!");
  } else {
    console.log(`Using existing admin: ${admin._id}`);
  }

  // ── 2. One TicketStock — 3 units: 2 available, 1 used ──
  let ticketStock = await TicketStock.findOne({ pnr: "SEEDPNR1" });
  if (!ticketStock) {
    ticketStock = await TicketStock.create({
      type: "flight",
      airline: "IndiGo",
      flightNumber: "6E202",
      origin: "BOM",
      destination: "GOI",
      departureDate: new Date("2026-12-20T08:00:00"),
      arrivalDate: new Date("2026-12-20T09:15:00"),
      cabinClass: "Economy",
      pnr: "SEEDPNR1",
      nameAdditionDeadline: new Date("2026-12-10"),
      costPerUnit: 3500,
      units: [
        { status: "available" },
        { status: "available" },
        { status: "used" },
      ],
      createdBy: admin._id,
    });
    console.log(`Created TicketStock: ${ticketStock._id}`);
  } else {
    console.log(`Using existing TicketStock: ${ticketStock._id}`);
  }

  // ── 3. One HotelStock — 2 units, both available ──
  let hotelStock = await HotelStock.findOne({ reservationRef: "SEEDRES1" });
  if (!hotelStock) {
    hotelStock = await HotelStock.create({
      hotelName: "Seed Beach Resort",
      destination: "Goa",
      roomType: "Deluxe Double",
      checkIn: new Date("2026-12-20"),
      checkOut: new Date("2026-12-23"), // 3 nights
      pricePerNight: 4000,
      reservationRef: "SEEDRES1",
      nameAdditionDeadline: new Date("2026-12-10"),
      units: [{ status: "available" }, { status: "available" }],
      createdBy: admin._id,
    });
    console.log(`Created HotelStock: ${hotelStock._id}`);
  } else {
    console.log(`Using existing HotelStock: ${hotelStock._id}`);
  }

  // ── 4. Two packages — bare, and fully wired ──
  let simplePkg = await Package.findOne({ title: "Seed Package — No Stock" });
  if (!simplePkg) {
    simplePkg = await Package.create({
      title: "Seed Package — No Stock",
      destination: "Goa",
      sellPrice: 5000,
      otherItems: [{ label: "Local guide", cost: 1000 }],
      isActive: true,
      isPublic: true,
      createdBy: admin._id,
    });
    console.log(`Created Package (no stock): ${simplePkg._id}`);
  }

  let fullPkg = await Package.findOne({ title: "Seed Package — Goa Getaway" });
  if (!fullPkg) {
    fullPkg = await Package.create({
      title: "Seed Package — Goa Getaway",
      destination: "Goa",
      sellPrice: 15000,
      flightRefs: [{ stock: ticketStock._id, unitsPerBooking: 1 }],
      hotelRefs: [{ stock: hotelStock._id, unitsPerBooking: 1 }],
      otherItems: [{ label: "Local guide", cost: 2000 }],
      isActive: true,
      isPublic: true,
      createdBy: admin._id,
    });
    console.log(`Created Package (with stock): ${fullPkg._id}`);
  }

  console.log("\n── Seed summary — expect these when you test ──");
  console.log("Admin:", admin._id, admin.phone);
  console.log(
    "TicketStock:",
    ticketStock._id,
    "→ availableUnits should read 2",
  );
  console.log("HotelStock:", hotelStock._id, "→ availableUnits should read 2");
  console.log(
    "Package (no stock):",
    simplePkg._id,
    "→ availableSlots should read 0, costPrice 1000",
  );
  console.log(
    "Package (with stock):",
    fullPkg._id,
    "→ availableSlots should read min(2,2)=2, costPrice 3500+4000×3+2000=17500",
  );

  await mongoose.disconnect();
  console.log("Done.");
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
