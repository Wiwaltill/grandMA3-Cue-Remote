interface QuitDependencies {
  needsConfirmation:()=>boolean;
  confirm:()=>Promise<boolean>;
  shutdown:()=>Promise<void>;
  quit:()=>void;
  onError:()=>Promise<void>;
}
/** One shared path for window-close, menu Quit and Cmd+Q. No teardown before consent. */
export class QuitController {
  allowExit=false;
  closing=false;
  private task: Promise<void> | null=null;
  private readonly dependencies: QuitDependencies;
  constructor(dependencies: QuitDependencies) {this.dependencies=dependencies;}
  request=(): Promise<void>=>{
    if(this.task)return this.task;
    this.task=this.run().finally(()=>{this.task=null;});
    return this.task;
  };
  private async run() {
    if(this.allowExit)return;
    try{
      if(this.dependencies.needsConfirmation() && !await this.dependencies.confirm())return;
      this.closing=true;
      await this.dependencies.shutdown();
      this.allowExit=true;
      this.dependencies.quit();
    }catch{
      this.closing=false;
      await this.dependencies.onError();
    }
  }
}
