export class CommandError extends Error{

    public level: string;
    public message: string;

    constructor(message: string, level = "error"){
        super(message);
        this.level = level;
        this.message = message; 
    }
}