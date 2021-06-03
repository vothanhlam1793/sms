STATE_MODEM = {
    START: 0,
    IDLE: 1,
    PROCESS: 2,
    ERROR: 3
}

class StartState{   
    handle(cmd, data, _modem, cb, next_state){
        console.log("Start State")
        next_state.state = STATE_MODEM.IDLE;
    }
}
class IdleState{   
    handle(cmd, data, _modem, cb, next_state){
        console.log("Idle State")
        next_state.state = STATE_MODEM.PROCESS;
    }
}
class ProcessState{   
    handle(cmd, data, _modem, cb, next_state){
        console.log("Process State")
        next_state.state = STATE_MODEM.ERROR;
    }
}
class ErrorState{   
    handle(cmd, data, _modem, cb, next_state){
        console.log("Error State")
        next_state.state = STATE_MODEM.IDLE;
    }
}

class StateFactory {
    getState(state){
        switch(state){
            case STATE_MODEM.START: {
                return new StartState();
            }
            case STATE_MODEM.IDLE: {
                return new IdleState();
            }
            case STATE_MODEM.PROCESS: {
                return new ProcessState();
            }
            case STATE_MODEM.ERROR: {
                return new ErrorState();
            }
            default: {
                console.log("Not found state support");
                return {}
            }
        }
    }
}

class StateMachine {
    constructor(){
        this.state = STATE_MODEM.START;
        this.stateFactory = new StateFactory();
    }
    setState(state){
        this.state = state;
    }
    handle(cmd, data, modem, cb){
        var state = this.stateFactory.getState(this.state);
        state.handle(cmd, data, modem, cb, this);
    }
}

class SMSGate {
    constructor(){
        this.path = "";
        this.modem = {};
        this.name = "";
        this.stateMachine = new StateMachine();
    }
    func(type){

    }
    set_feature(type, option){

    }
    get_info(type){

    }
    init(){

    }
    control(type){

    }
}

s = new SMSGate();
