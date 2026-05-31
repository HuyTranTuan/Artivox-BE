const express = require("express");
const locationController = require("@controllers/location.controller");

const router = express.Router();

router.get("/provinces", locationController.getAllProvinces);
router.get("/wards", locationController.getAllWards);
router.get("/wards/:provinceCode", locationController.getWardsByProvince);

module.exports = router;
