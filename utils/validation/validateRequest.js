
exports.validateParamsWithJoi = (payload, schemaKeys) => {
    const { error } = schemaKeys.validate(payload, { abortEarly: false, convert: false })
    if (error) {
        const message = error.details.map((e) => e.message).join("\n");
        return {
            isValid: false,
            message: message
        }
    }
    return { isValid: true }
}
