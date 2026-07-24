const ApiError =
    require('../utils/ApiError');

const PatientRepository =
    require('../repositories/PatientRepository');

const TriageRepository =
    require('../repositories/TriageRepository');

const AnamneseRepository =
    require('../repositories/AnamneseRepository');

const AnamneseTemplateRepository =
    require('../repositories/AnamneseTemplateRepository');

class AnamneseService {

    async create(data) {

        const patient =
            await PatientRepository.findById(
                data.patient_id
            );

        if (!patient) {

            throw new ApiError(
                'Paciente não encontrado',
                404
            );

        }

        if (!data.chief_complaint) {

            throw new ApiError(
                'Queixa principal é obrigatória',
                400
            );

        }

        if (data.triage_id) {

            const triage =
                await TriageRepository.findById(
                    data.triage_id
                );

            if (!triage) {

                throw new ApiError(
                    'Triagem não encontrada',
                    404
                );

            }

        }

        if (data.template_id) {

            const template =
                await AnamneseTemplateRepository.findById(
                    data.template_id
                );

            if (!template) {

                throw new ApiError(
                    'Template não encontrado',
                    404
                );

            }

        }

        return AnamneseRepository.create(data);
    }

    async update(id, data) {

        const anamnese =
            await AnamneseRepository.findById(id);

        if (!anamnese) {

            throw new ApiError(
                'Anamnese não encontrada',
                404
            );

        }

        return AnamneseRepository.update(
            id,
            data
        );
    }

    async findById(id) {

        const anamnese =
            await AnamneseRepository.findById(id);

        if (!anamnese) {

            throw new ApiError(
                'Anamnese não encontrada',
                404
            );

        }

        return anamnese;
    }

    async findByPatient(patientId) {

        return AnamneseRepository.findByPatient(
            patientId
        );
    }

    async history(patientId) {

        return AnamneseRepository.history(
            patientId
        );
    }

}

module.exports =
    new AnamneseService();