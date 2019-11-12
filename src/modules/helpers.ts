export function trimInput(inputObj) {
    let fields = Object.keys(inputObj);

    let trimmedObj = fields.reduce((obj: any, key:string) => {
        obj[key] = inputObj[key].trim();
        if (key === "phone") {
            const regEx = new RegExp("[ -]*\\n*", "g");
            obj[key] = obj[key].replace(regEx, "");
        }
        return obj
    }, {})

    return trimmedObj;
}