const ConsultationService =
    require('../services/ConsultationService');

class ConsultationController {

    async create(req, res, next) {

        try {

            const result =
                await ConsultationService.create({

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

    async findById(req, res, next) {

        try {

            const result =
                await ConsultationService.findById(
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
                await ConsultationService.findByPatient(
                    req.params.patientId
                );

            return res.json(result);

        } catch (error) {

            next(error);

        }

    }

    async saveCids(
    req,
    res,
    next
) {

    try {

        const result =
            await ConsultationService.saveCids(

                req.params.id,

                req.body.cid_ids || []

            );

        return res.json(result);

    } catch (error) {

        next(error);

    }

}

}

module.exports =
    new ConsultationController();