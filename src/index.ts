import express, { Express, NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import taskSchema from "./schemas/tasks.schema";
import Joi from "joi";

const prisma = new PrismaClient();

const app = express();

app.use(express.json());

const port = 8000;

enum payloadStatus {
    SUCCESS = "SUCCESS",
    ERROR = "ERROR"
}

enum payloadSuccesssMessages {
    CREATE = "SUCCESS ON CREATING DATA",
    UPDATE = "SUCCESS ON UPDATING DATA",
    DELETE = "SUCCESS ON DELETING DATA",
    READ = "SUCCESS ON READING DATA"
}

const basePayload = {
    status: payloadStatus.ERROR,
    message: "ERROR",
    payload: {}
}

function isIdPresent(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "Parameter 'id' is required" });
    }
    next();
}

app.get("/", (req: Request, res: Response) => {
    res.send("root /");
})


app.get("/tasks", async (req: Request, res: Response) => {
    const payload = basePayload;

    try {
        const tasks = await prisma.task.findMany();
        
        payload.status = payloadStatus.SUCCESS;
        payload.message = payloadSuccesssMessages.READ;
        payload.payload = tasks;

        res.status(200).send(payload);
    } catch (error) {
        res.status(400).send(payload);
    }
})
app.post("/tasks", async (req: Request, res: Response) => {
    const { error, value } = taskSchema.validate(req.body);

    if (error) {
        const payload = basePayload;
        payload.message = error.message;
        res.status(400).send(payload);
    }

    const payload = basePayload;

    try {
        const task = await prisma.task.create({
            data: {
                title: value.title,
                description: value.description,
                completed: value.completed,
            }
        }) 
        
        payload.status = payloadStatus.SUCCESS;
        payload.message = payloadSuccesssMessages.CREATE;
        payload.payload = task;

        res.status(201).send(payload);
    } catch (error) {
        console.error(error);
    }
})

app.get("/tasks/:id", isIdPresent, async (req: Request, res: Response) => {
    const payload = basePayload;

    try {
        const tasks = await prisma.task.findUnique({
            where: {
                id: parseInt(req.params.id)
            }
        });

        if (!tasks){
            payload.status = payloadStatus.ERROR;
            payload.message = "DATA NOT FOUND";
            res.status(404).send(payload);
        }
        
        payload.status = payloadStatus.SUCCESS;
        payload.message = payloadSuccesssMessages.READ;
        payload.payload = tasks!;

        res.status(200).send(payload);
    } catch (error) {
        res.status(400).send(payload);
    }
})


app.patch("/tasks/:id", async (req: Request, res: Response) => {
    const modifiedTaskSchema = taskSchema.keys({ 
        id: Joi.number().required()
    });

    const { error, value } = modifiedTaskSchema.validate({...req.params, ...req.body});

    if (error) {
        const payload = basePayload;
        payload.message = error.message;
        res.status(400).send(payload);
    }

    const payload = basePayload;

    try {
        const task = await prisma.task.update({
            where: {
                id: value.id
            },
            data: {
                title: value.title,
                description: value.description
            }
        })

        payload.status = payloadStatus.SUCCESS;
        payload.message = payloadSuccesssMessages.UPDATE;
        payload.payload = task;

        res.status(200).send(payload);

    } catch (error) {
        console.error(error);
    }
})

app.patch("/tasks/:id/change-complete", async (req: Request, res: Response) => {
    const { id } = req.params;

    const payload = basePayload;

    if (!id) {
        payload.message = "Parameter 'id' is required";
        res.send(400).send(payload);
    }

    try {
        const task = await prisma.task.findUnique({
            where:{
                id: parseInt(id)
            }
        })

        const modifiedTask = await prisma.task.update({
            where: {
                id: parseInt(id),
            },
            data: {
                completed: !task?.completed,
            }
        })

        payload.status = payloadStatus.SUCCESS;
        payload.message = payloadSuccesssMessages.UPDATE;
        payload.payload = modifiedTask;

        res.status(200).send(payload);
    } catch (error) {
        console.error(error);
    }
})

app.delete("/tasks/:id", isIdPresent, async (req: Request, res: Response) => {
    // const { id } = req.params;

    const payload = basePayload;

    try {
        const task = await prisma.task.findUnique({
            where: {
                id: parseInt(req.params.id)
            }
        })

        if (!task) {
            payload.status = payloadStatus.ERROR;
            payload.message = "DATA NOT FOUND";
            res.status(404).send(payload);
        }

        await prisma.task.delete({
            where: {
                id: parseInt(req.params.id),
            }
        })

        payload.status = payloadStatus.SUCCESS;
        payload.message = payloadSuccesssMessages.DELETE;

        res.status(200).send(payload);
    } catch (error) {
        console.error(error);
    }
})

app.listen(port, () => console.log(`Running on http://localhost:${port}/`));