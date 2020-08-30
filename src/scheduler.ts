import { IRecord } from './interfaces';
import { config, algorithmConfig } from './configProvider';

export class EasinessFactorParameterSet {
    // new EF = EF + (alpha-(4-q)*(beta+(4-q)*(alpha-beta)))
    alpha: number;
    beta: number;

    constructor(
        alphaCandidate: number, 
        betaCandidate: number
    ) {
        // as in the original function: beta >= (alpha - beta)
        // below conditional ensures alpha and beta can be passed in any order
        if (betaCandidate >= (alphaCandidate - betaCandidate)){
            this.beta = betaCandidate;
            this.alpha = alphaCandidate;
        }
        else {
            this.beta = alphaCandidate;
            this.alpha = betaCandidate;
        }
    }

    /**
     * @function getIncrement returns an EF increment based on user response
     * @param correctness assessment made by the user when answering
     */
    getIncrement(correctness: number){
        return (this.alpha - (4 - correctness) * 
            (this.beta+(4 - correctness) * (this.alpha - this.beta)));
    }
}

export class SchedulingAlgorithm {
    // new EF = EF + (0.1-(4-q)*(0.08+(4-q)*0.02))
    // at scale 3 the easiness factor should stay the same (roots of this polynomial are in 3 and 9)
    // never drop EF below 1.3

    startingDelays: [number, number];
    initialEasinessFactor: number;
    startingIntervals: [number, number];  // should be in the ballpark of minutes

    constructor(
        algorithmConfig: any
    ){
        this.startingDelays = algorithmConfig.new.startingDelays;
        this.initialEasinessFactor = algorithmConfig.new.initialFactor;
        this.startingIntervals = algorithmConfig.new.startingIntervals;
    }

    /**
     * @function getNewEasinessFactor returns new EF after answering
     * @param previousEasinessFactor easiness factor prior to answering
     * @param correctness response assessment by the user when answering
     */
    getNewEasinessFactor(
        previousEasinessFactor: number,
        correctness: number,
        parameters: [number, number] = [0.1, 0.08]
    ){
        //TODO: change up the parameters in the function into learnable ones (TF.js)
        // for now the increment will have fixed original parameters
        // these will be later optimized by XGBoost or something along these lines
        let increment = new EasinessFactorParameterSet(parameters[0], parameters[1]).getIncrement(correctness);
        let newEFCandidate = previousEasinessFactor + increment;
        if (newEFCandidate < 1.3){
            return 1.3;
        }
        else{
            return previousEasinessFactor + increment;
        }
    }

    /**
     * @function computeNextInterval calculates next revision date after answering
     * @param lastRevisionDate last revision Date Object loaded from the records database
     * @param easinessFactor post-answer easiness factor
     */
    computeNextInterval(lastRevisionDate: Date, easinessFactor: number = this.initialEasinessFactor){
        return new Date(lastRevisionDate.getTime() * easinessFactor);
    }
}

export class Scheduler {
    config: any;
    algorithmWrapper: SchedulingAlgorithm;

    constructor(batch: string){
        this.config = config();
        this.algorithmWrapper = new SchedulingAlgorithm(
            algorithmConfig(batch, this.config)
        )
    }

    /**
     * @function getSchedule returns schedule for a given IRecord
     * @param IRecord an IRecord from which to fetch next revision
     */
    getNextRevision(record: IRecord){
        return record.flashcard?.scheduler?.nextRevision
    }

    /**
     * @function setNextRevision 
     * @param record an IRecord to be modified
     */
    setNextRevision(record: IRecord, answerCorrectness: number){
        if (record.flashcard !== undefined && record.flashcard.scheduler !== undefined) {
            record.flashcard.scheduler.nextRevision = 
            this.algorithmWrapper.computeNextInterval(
                new Date(record.flashcard.scheduler.nextRevision),
                this.algorithmWrapper.getNewEasinessFactor(
                    record.flashcard.scheduler.easinessFactor, 
                    answerCorrectness
                )
            ).valueOf();
        }
        return record;
    }
}