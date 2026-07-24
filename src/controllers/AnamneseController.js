const AnamneseService =
    require('../services/AnamneseService');

class AnamneseController {

    async create(req, res, next) {

        try {

            const result =
                await AnamneseService.create({

                    ...req.body,

                    doctor_id:
                        req.user.id

                });

            return res
                .status(201)
                .json(result);

        } catch (error) {

            next(error);

        }

    }

    async update(req, res, next) {

        try {

            const result =
                await AnamneseService.update(

                    req.params.id,

                    req.body

                );

            return res.json(result);

        } catch (error) {

            next(error);

        }

    }

    async findById(req, res, next) {

        try {

            const result =
                await AnamneseService.findById(
                    req.params.id
                );

            return res.json(result);

        } catch (error) {

            next(error);

        }

    }

    async findByPatient(req, res, next) {

        try {

            const result =
                await AnamneseService.findByPatient(
                    req.params.patientId
                );

            return res.json(result);

        } catch (error) {

            next(error);

        }

    }

    async history(req, res, next) {

        try {

            const result =
                await AnamneseService.history(
                    req.params.patientId
                );

            return res.json(result);

        } catch (error) {

            next(error);

        }

    }

}

module.exports =
    new AnamneseController();