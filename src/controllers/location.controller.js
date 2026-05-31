const path = require("path");
const fs = require("fs");

const provinceData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../public/province.json"), "utf-8")
);
const wardData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../public/ward.json"), "utf-8")
);

const getAllProvinces = (req, res) => {
  res.success(provinceData.provinces, "Provinces fetched");
};

const getAllWards = (req, res) => {
  const all = Object.values(wardData.new_wards_by_province).flat();
  res.success(all, "Wards fetched");
};

const getWardsByProvince = (req, res) => {
  const { provinceCode } = req.params;
  // Basic alphanumeric validation – prevents path traversal / injection
  if (!/^[A-Z0-9_]{1,10}$/i.test(provinceCode)) {
    return res.status(400).json({ message: "Invalid province code" });
  }
  const code = provinceCode.toUpperCase();
  const wards = wardData.new_wards_by_province[code] ?? [];
  res.success(wards, `Wards for province ${code} fetched`);
};

module.exports = { getAllProvinces, getAllWards, getWardsByProvince };
