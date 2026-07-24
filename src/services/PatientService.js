const ApiError =
    require('../utils/ApiError');

const PatientRepository =
    require('../repositories/PatientRepository');

class PatientService {

    async create(data) {

        const existingPatient =
            await PatientRepository.findByCpf(
                data.cpf
            );

        if (existingPatient) {

            throw new ApiError(
                'CPF já cadastrado',
                400
            );
        }

        return PatientRepository.create(data);
    }

    async findById(id) {

        const patient =
            await PatientRepository.findById(id);

        if (!patient) {

            throw new ApiError(
                'Paciente não encontrado',
                404
            );
        }

        return patient;
    }

    async findAll() {

        return PatientRepository.findAll();
    }

    async update(id, data) {

        const patient =
            await PatientRepository.findById(id);

        if (!patient) {

            throw new ApiError(
                'Paciente não encontrado',
                404
            );
        }

        return PatientRepository.update(
            id,
            data
        );
    }

    async deactivate(id) {

        const patient =
            await PatientRepository.findById(id);

        if (!patient) {

            throw new ApiError(
                'Paciente não encontrado',
                404
            );
        }

        await PatientRepository.deactivate(id);
    }

    async search(filters) {

        return PatientRepository.searchSummary(filters);

    }

    async getHistory(id) {

    const patient =
        await PatientRepository.findById(id);

    if (!patient) {

        throw new ApiError(
            'Paciente não encontrado',
            404
        );
    }

    return PatientRepository.getHistory(id);

}

async search(filters) {

    return PatientRepository
        .searchSummary(filters);

}

}

module.exports =
    new PatientService();