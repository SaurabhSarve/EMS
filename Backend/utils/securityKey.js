const bcrypt = require("bcrypt");;

const salt = 10;

const keyIncrypt = async (key) => {
   try{
    console.log(key)
     const hashSecurityKey = await bcrypt.hash(key, salt);
     return hashSecurityKey;
   }
   catch(err){
    return err.message
   }
}

const keyDecrypt = async (Key, hashKey) => {
    try{
        const result = await bcrypt.compare(Key, hashKey);
        return result;
    }
    catch(err){
        return err.message
    }
}

module.exports = {keyIncrypt, keyDecrypt}