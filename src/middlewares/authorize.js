const authorize = () => {
    return (req, res, next) => {
        // const userRole = req.user.role;

        // if (allowedRoles.includes(userRole)) {
        //     return next();
        // } else {
        //     return res.status(403).json({
        //         EC: 1,
        //         message: "Forbidden: You do not have access to this resource."
        //     });
        // }
    };
};

module.exports = {
    authorize
};