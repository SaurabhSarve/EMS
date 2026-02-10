const User = require("../models/user");

const generateEmployeeId = async () => {
    // 'numericOrdering: true' ensures #EMP-10 comes AFTER #EMP-9
    const lastUser = await User.findOne({
        employeeId: { $exists: true, $ne: null } //only gives existing value and ne ignores the null values
    })
        .collation({ locale: "en_US", numericOrdering: true }) //collation is used to sort the employee id with numericOrdering help to sort the employee id with numeric value
        .sort({ employeeId: -1 });

    let nextNum = 2025; // Default starting number
    if (lastUser && lastUser.employeeId) {
        const match = lastUser.employeeId.match(/#?EMP-(\d+)/);
        if (match && match[1]) {
            nextNum = parseInt(match[1]) + 1;
        }
    }
    return `#EMP-${nextNum}`;
};

module.exports = generateEmployeeId;
