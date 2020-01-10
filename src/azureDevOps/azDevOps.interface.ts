import * as git from "azure-devops-node-api/GitApi";
import * as workItem from "azure-devops-node-api/WorkItemTrackingApi";
import * as iteration from "azure-devops-node-api/WorkApi";

export interface IConnectAzDevOps {
    git: git.IGitApi;
    workItem: workItem.IWorkItemTrackingApi;
    iteration: iteration.IWorkApi;
}

export interface IIterationDetails {
    id: string;
    path: string;
}

export interface IAzDevOpsManagementMethods {

    getConnection(): Promise<IConnectAzDevOps>;
    getCurrentIteration(iterationConnection: iteration.IWorkApi): Promise<IIterationDetails>;
    checkIfUSAlreadyExist(workItemConnection: workItem.IWorkItemTrackingApi, currentIteration: string): Promise<number>;
    createUserStory(WORKITEM: workItem.IWorkItemTrackingApi, currentIteration: string): Promise<number>;
    createCommitsAndPush(GIT: git.IGitApi, key: string, path: string[], repo: string): Promise<string>;
    createPR(GIT: git.IGitApi, repo: string, userStoryId: number): Promise<number>;
    updatePR(gitConnection: git.IGitApi, pullRequestId: number, repo: string, azDevOpsUserId: string): Promise<number>;
}