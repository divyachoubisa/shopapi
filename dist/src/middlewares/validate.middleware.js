export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));
            res.status(422).json({ error: "Validation failed", details });
            return;
        }
        req.body = result.data;
        next();
    };
}
