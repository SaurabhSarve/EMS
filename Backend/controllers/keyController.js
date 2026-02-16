const keyModel = require("../models/key.model.js");
const {keyDecrypt, keyIncrypt} = require("../utils/securityKey.js")

const createKey = async (req, res) => {
    try{
        const {roleName, key} = req.body;
        
        if(!roleName || !key) {
            return res.status(401).json({message: "Role and Key both is Required"});
        }

        const hashSecurityKey = await keyIncrypt(key);

        const keyDetails = keyModel({
            roleName,
            keyValue: hashSecurityKey
        });

        await keyDetails.save();

        return res.status(200).json({message:"New Key Add Successful"})
    }
    catch(err){
        return res.status(500).json({error: err.message})
    }
}

const changeKey = async(req, res) => {
    try{
        const {superKey, roleName, newSecurityKey} = req.body;
        const {keyId} = req.params

        const superKeyDetails = await keyModel.findOne({roleName: "Super Admin"});

        let keyResult = await keyDecrypt(superKey,superKeyDetails.keyValue);
        
        if(!keyResult){
            return res.status(401).json({message: "Super key is Incorrect"});
        }

        const hashKey = await keyIncrypt(newSecurityKey);

        await keyModel.findByIdAndUpdate(keyId,
            {keyValue: hashKey}
        );

        return res.status(200).json({message: `${roleName} Security key update successfully.`})
    }
    catch(err){
        return res.status(500).json({message: err.message});
    }
}

const superKeyAccess = async (req, res) => {
    try{
        const {securityKey} = req.body;

        const keyDetails = await keyModel.findOne({roleName: "Super Admin"});

        const decryptResult = await keyDecrypt(securityKey, keyDetails.keyValue);

        if(!decryptResult){
            return res.status(401).json({message: "Incorrect Security Key"});
        }

        return res.status(200).json({message: "Access Grant"});
    }
    catch(err){
        return res.status(500).json({error: err.message})
    }
}

const allSecurityKey = async (req, res) => {
    try{
        const allKey = await keyModel.find();

        return res.status(200).json({allkey: allKey})
    }
    catch(err){
        return res.status(500).json({error: err.message})
    }
}

module.exports = {createKey, changeKey, superKeyAccess, allSecurityKey};