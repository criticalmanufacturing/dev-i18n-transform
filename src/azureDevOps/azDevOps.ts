//#region Imports
import * as azdev from "azure-devops-node-api";
import * as fs from "fs";
import * as git from "azure-devops-node-api/GitApi";
import * as workItem from "azure-devops-node-api/WorkItemTrackingApi";
import * as iteration from "azure-devops-node-api/WorkApi";
import * as iGit from "azure-devops-node-api/interfaces/GitInterfaces";
import { Wiql, WorkItemQueryResult } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { JsonPatchDocument } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { IConnectAzDevOps, IAzDevOpsManagementMethods, IIterationDetails } from "./azDevOps.interface";
import { TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces";

const argv = require("minimist")(process.argv);

// Import config
let config: any;
if (argv["config"] === undefined || argv["config"] === null) {
  config = require("../i18n-import.config.json");
} else {
  config = require(argv["config"]);
}

//#endregion

//#region Constants
const url = (<any>config).sourceControl.url;
const project = (<any>config).sourceControl.project;
const token: string = (<any>config).sourceControl.token || process.env.AccessToken || null;
const workItemTitle = (<any>config).sourceControl.workItem.title;
const workItemType = (<any>config).sourceControl.workItem.type;
const workItemStateToIgnore = (<any>config).sourceControl.workItem.stateToIgnore;
//#endregion

export class AzDevOpsManagement implements IAzDevOpsManagementMethods {

  public header = {
    "Content-Type": "application/json-patch+json",
  };

  //#region Public Methods

  /**
   * Get connection to Azure DevOps
   */
  public async getConnection(): Promise<IConnectAzDevOps> {
    try {
      if (token === null) {
        throw new Error("Missing access token.");
      }

      let tokenHandler = azdev.getHandlerFromToken(token);

      let connection = new azdev.WebApi(url, tokenHandler, {ignoreSslError: true});
      let gitConnection: git.IGitApi =  await connection.getGitApi();
      let workItemConnection: workItem.IWorkItemTrackingApi =  await connection.getWorkItemTrackingApi();
      let iterationConnection: iteration.IWorkApi = await connection.getWorkApi();
      return {
          git: gitConnection,
          workItem: workItemConnection,
          iteration: iterationConnection
      };
    }
    catch (err) {
      console.log(err);
      return null;
    }
  }

  /**
   * Get current iteration of team
   * @param iterationConnection (connection)
   */
  public async getCurrentIteration(iterationConnection: iteration.IWorkApi): Promise<IIterationDetails> {
    try {
      // Get current iteration of given team
      let currentIteration = await iterationConnection.getTeamIterations({
                                                                            project: project,
                                                                            team: (<any>config).sourceControl.team,
                                                                         },
                                                                         "current")
                                                                         .then((output: TeamSettingsIteration[]) => { return output; });
      return {
        id: currentIteration[0].id,
        path: currentIteration[0].path
      };
    }
    catch (err) {
      console.log(err);
      return null;
    }
  }

  /**
   * Check if already exists a user story with title = userStoryName
   * @param iterationConnection (connection)
   * @param currentIteration (path of current iteration)
   */
  public async checkIfUSAlreadyExist(workItemConnection: workItem.IWorkItemTrackingApi, currentIteration: string) {
    try {

      // Create a wiql object and build our query
      let wiql: Wiql = {
        query: `SELECT [System.Id],[System.Title] FROM WorkItems WHERE [System.TeamProject] = '${project}' AND  [System.WorkItemType] = '${workItemType}' AND [System.IterationPath] = '${currentIteration}' AND [System.Title] = '${workItemTitle}' AND [System.State] NOT CONTAINS '${workItemStateToIgnore}'`
      };

      // Execute the query to get the list of work items in the results
      let results = await workItemConnection.queryByWiql(wiql).then((output: WorkItemQueryResult) => { return output; });

      if (results.workItems.length > 0) {
        return results.workItems[0].id;
      }
    }
    catch (err) {
      console.log(err);
    }
    return null;
  }

  /**
   * Create a new User Story
   * @param workItemConnection (connection)
   * @param currentIteration (path of current iteration)
   */
  public async createUserStory(workItemConnection: workItem.IWorkItemTrackingApi, currentIteration: string) {
    try {
      // Get JSON to create a new user story
      let userStoryJSON: JsonPatchDocument = this.createUserStoryJSON(currentIteration);

      // Create new user story
      let userStory = await workItemConnection.createWorkItem( this.header, userStoryJSON, project,  workItemType);

      return userStory.id;
    }
    catch (err) {
      console.log(err);
      return null;
    }
  }

  /**
   * Create commit and push to specified repository
   * @param gitConnection (connection)
   * @param key (package of config.packages)
   * @param path (array with paths changed)
   * @param repo (repository to make the commit and push)
   */
  public async createCommitsAndPush(gitConnection: git.IGitApi, key: string, path: string[], repo: string) {
    try {
        let arrayChanges: iGit.GitChange[] = [];
        let push: iGit.GitPush;
        let data: string;
        let oldObjectId;
        let objectId;
        const commitCriteria: iGit.GitQueryCommitsCriteria = <iGit.GitQueryCommitsCriteria> {
          itemVersion: {version: (<any>config).sourceControl.branch.target},
          $skip: 0,
          $top: 1,
        };

        /**
         * For each position in array "path" and according to "repo", read changed file, create changes and
         * that are pushed into an array
         */
        for (let index = 0; index < path.length; index++) {
          if (path[index].match(key)) {
            data = fs.readFileSync(path[index]).toString();
            let commits =  await gitConnection.getCommits(repo, commitCriteria, project);
            oldObjectId = commits.map((commit) => { return commit.commitId; });
            objectId = oldObjectId[0];
            let change = this.createChanges(path[index], key, data);
            arrayChanges.push(change);
          }
        }

        /**
         * Create Commit JSON
         * Create Push JSON
         * Create Push for specified repository
         */
        if (arrayChanges.length > 0) {
          let commitToRepository = this.createCommitJSON(arrayChanges);
          let pushCommits = this.createPushJSON(commitToRepository, objectId);
          push = await gitConnection.createPush(pushCommits, repo, project);
        }

        return push.pushedBy.id;
    }
    catch (err) {
        console.log(err);
        return null;
    }
  }

  /**
   * Create pull request
   * @param gitConnection (connection)
   * @param repo (repository to create a pull request)
   * @param userStoryId (id of user story to associate)
   */
  public async createPR(gitConnection: git.IGitApi, repo: string, userStoryId: number) {

    // Get last merge commit of target branch
    const pullRequestCriteria: iGit.GitPullRequestSearchCriteria = <iGit.GitPullRequestSearchCriteria>{ targetRefName: "refs/heads/ " +  (<any>config).sourceControl.branch.target};
    const pullRequests = await gitConnection.getPullRequests(repo, pullRequestCriteria, project);
    const lastMergeTargetCommit = pullRequests.map((request) => {return request.lastMergeTargetCommit.commitId; });

    // Get JSON to create pull request
    let gitPullRequestToCreate: iGit.GitPullRequest = this.createPullRequestJSON(lastMergeTargetCommit[0], repo, userStoryId);

    // Create new pull request
    let createPRequest = await gitConnection.createPullRequest(gitPullRequestToCreate, repo, project, true);
    return createPRequest.pullRequestId;
  }

  /**
   * Update pull request
   * @param gitConnection (connection)
   * @param pullRequestId (id of pull request to be updated)
   * @param repo (repository where is located the pull request to be updated)
   * @param azDevOpsUserId (id of Azure DevOps user)
   */
  public async updatePR(gitConnection: git.IGitApi, pullRequestId: number, repo: string, azDevOpsUserId: string) {
    // Get JSON to update pull request
    let gitPullRequestToUpdate: iGit.GitPullRequest = this.updatePullRequestJSON(azDevOpsUserId);

    // Create pull request reviewer and approve
    await gitConnection.createPullRequestReviewer({vote: 10}, repo, pullRequestId, azDevOpsUserId, project);

    // Update pull request to be auto-completed
    let updatePRequest = await gitConnection.updatePullRequest(gitPullRequestToUpdate, repo, pullRequestId, project);

    return updatePRequest.pullRequestId;
  }
  //#endregion


  //#region Private Methods

  /**
   * JSON to create a new user story
   * @param currentIteration (path of current iteration)
   */
  private createUserStoryJSON(currentIteration: string) {
    let userStoryJSON: JsonPatchDocument = [
      {
        "op": "add",
        "from": null,
        "path": "/fields/System.Title",
        "value": workItemTitle
      },
      {
        "op": "add",
        "from": null,
        "path": "/fields/System.IterationPath",
        "value": currentIteration
      }
    ];
    return userStoryJSON;
  }

  /**
   * JSON to identify changes
   * @param path (path changed)
   * @param key (package in config.packages)
   * @param data (content of path changed)
   */
  private createChanges(path: string, key: string, data: string) {
    let i18nPackages = Object.keys((<any>config).packages.i18n);
    let resourcesPackages = Object.keys((<any>config).packages.resources);
    let parameter: string;

    if (i18nPackages.includes(key)) {
      parameter = (<any>config.packages.i18n)[key].repository;
    } else if (resourcesPackages.includes(key)) {
      parameter = key;
      path = path.replace(/\\/gm, "/");
    }

    let regexString: string = ".*PARAMETER";
    regexString = regexString.replace("PARAMETER", parameter);
    let regExpression: RegExp = new RegExp(regexString);
    path = path.replace(regExpression, "");

    let change: iGit.GitChange = {
      "changeType": 2,
      "item": {
        "path": path
      },
      "newContent": {
        "content": data,
        "contentType": 0
      }
    };

    return change;
  }

  /**
   * JSON to create a new commit
   * @param changesArray (array with changes)
   */
  private createCommitJSON(changesArray: iGit.GitChange[]) {
    let commit: iGit.GitCommitRef = {
        "comment": (<any>config).sourceControl.commit.comment,
        "changes": changesArray
      };
    return commit;
  }

  /**
   * JSON to create a new push
   * @param commits (commit to make push)
   * @param oldObjectId (id of last commit)
   */
  private createPushJSON(commits: iGit.GitCommitRef, oldObjectId: string) {
    let push: iGit.GitPush = {
        "refUpdates": [
            {
              "name": "refs/heads/" +  (<any>config).sourceControl.branch.source,
              "oldObjectId": oldObjectId
            }
          ],
          "commits": [commits]
    };
    return push;
  }

  /**
   * JSON to create a new pull request
   * @param lastMergeTargetCommit (id of last commit merged)
   * @param repo (repository to create a pull request)
   * @param userStoryId (id of user story to associate)
   */
  private createPullRequestJSON(lastMergeTargetCommit: string, repo: string, userStoryId: number) {
    let gitPullRequestToCreate: iGit.GitPullRequest = {
      lastMergeTargetCommit: {
        commitId: lastMergeTargetCommit
      },
      createdBy: {
                  "id": (<any>config).sourceControl.user.id,
                  "displayName": (<any>config).sourceControl.user.displayName
      },
      title: (<any>config).sourceControl.pullRequest.title,
      description: (<any>config).sourceControl.pullRequest.description,
      repository: {
                  id: repo,
                  project: {
                          name: project,
                          url: url
                  },
                  url: url + "/" + repo,
      },
      sourceRefName: "refs/heads/" +  (<any>config).sourceControl.branch.source,
      targetRefName: "refs/heads/" +  (<any>config).sourceControl.branch.target,
      workItemRefs: [{id: `${userStoryId}`}]
    };
    return gitPullRequestToCreate;
  }

  /**
   * JSON to update the pull request
   * Set auto-complete
   * @param azDevOpsUserId (id of person to set pull request to be auto-completed and approve pull request)
   */
  private updatePullRequestJSON(azDevOpsUserId: string) {
    let gitPullRequestToUpdate: iGit.GitPullRequest = {
      autoCompleteSetBy: {
        id: azDevOpsUserId
      },
      completionOptions: {
        bypassPolicy: false,
        bypassReason: "",
        deleteSourceBranch: true,
        mergeCommitMessage: (<any>config).sourceControl.pullRequest.mergeCommitMessage,
        mergeStrategy: 1,
        transitionWorkItems: false
      }
    };
    return gitPullRequestToUpdate;
  }

  //#endregion
}