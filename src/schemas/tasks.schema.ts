import Joi from "joi";

const taskSchema = Joi.object({
    id: Joi.number().forbidden(),
    title: Joi.string().min(3).required().error(new Error("The parameter 'title' is required")),
    description: Joi.string().min(3),
    completed: Joi.bool(),
    createdAt: Joi.any().forbidden(),
    updatedAt: Joi.any().forbidden()
})

export default taskSchema;