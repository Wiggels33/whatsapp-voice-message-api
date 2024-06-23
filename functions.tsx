import * as fs from "node:fs";

interface IWriteErrortoErrorLog {
    text: string;
    err: Error;
}


/**
 *
 * @param text
 * @param err
 * @returns viod
 */
export const writeErrortoErrorLog = ({text, err}: IWriteErrortoErrorLog) => {
    // create errors.los file and write err to it
    fs.appendFile('errors.log', text + err, (err) => {
        if (err) {
            console.log(err);
        }
    });
}