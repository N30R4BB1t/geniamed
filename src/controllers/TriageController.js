const TriageService =
    require('../services/TriageService');

class TriageController {

    async create(
        req,
        res,
        next
    ) {

        try {

            const triage =
                await TriageService.create({

                    ...req.body,

                    nurse_id:
                        req.user.id

                });

            return res
                .status(201)
                .json(triage);

        } catch (error) {

            next(error);

        }

    }

    async findByPatient(
        req,
        res,
        next
    ) {

        try {

            const result =
                await TriageService.findByPatient(
                    req.params.patientId
                );

            return res.json(
                result
            );

        } catch (error) {

            next(error);

        }

    }

}

module.exports =
    new TriageController();