export function toNumber(formDataValue: FormDataEntryValue | null) {
    return formDataValue ? Number(formDataValue) : undefined;
}
