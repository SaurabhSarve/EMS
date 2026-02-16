const express = require('express').default || require('express');
const router = express.Router();

const {createKey, changeKey, superKeyAccess, allSecurityKey} = require("../controllers/keyController.js");

const {protect} = require("../middleware/auth.js");

router.use(protect);

router.route("/createKey").post(createKey);
router.route("/changeKey/:keyId").put(changeKey);
router.route("/superAdmin").post(superKeyAccess);
router.route("/allkey").get(allSecurityKey);


module.exports = router;