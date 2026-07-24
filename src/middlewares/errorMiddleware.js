module.exports = (
    error,
    req,
    res,
    next
) => {

    const statusCode =
        error.statusCode || 500;

    return res
        .status(statusCode)
        .json({

            error:
                error.message ||

                'Erro interno'

        });

};