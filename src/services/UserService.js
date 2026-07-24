const bcrypt = require('bcrypt');

const ApiError =
    require('../utils/ApiError');

const UserRepository =
    require('../repositories/UserRepository');

class UserService {

    async create(data) {

        const existingUser =
            await UserRepository.findByEmail(
                data.email
            );

        if (existingUser) {

            throw new ApiError(
                'E-mail já cadastrado',
                400
            );
        }

        const password_hash =
            await bcrypt.hash(
                data.password,
                10
            );

        return UserRepository.create({

            role_id:
                data.role_id,

            full_name:
                data.full_name,

            cpf:
                data.cpf,

            email:
                data.email,

            password_hash

        });

    }

}

module.exports =
    new UserService();