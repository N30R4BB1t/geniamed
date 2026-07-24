const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ApiError =
    require('../utils/ApiError');

const UserRepository =
    require('../repositories/UserRepository');

class AuthService {

    async login(
        email,
        password
    ) {

        const user =
            await UserRepository.findByEmail(
                email
            );

        if (
            !user ||
            !user.active
        ) {

            throw new ApiError(
                'Usuário ou senha inválidos',
                401
            );
        }

        const validPassword =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!validPassword) {

            throw new ApiError(
                'Usuário ou senha inválidos',
                401
            );
        }

        const token =
            jwt.sign(
                {
                    id: user.id,
                    role: user.role_name
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN
                }
            );

        delete user.password_hash;

        return {
            token,
            user
        };
    }

}

module.exports =
    new AuthService();