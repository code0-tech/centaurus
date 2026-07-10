import "reflect-metadata"
import { Action, CodeZeroEvent } from "@code0-tech/hercules"
import { GitHubIssueDataType } from "./data_types/issues/githubIssue.js"
import { GitHubAddAssigneesRequestDataType } from "./data_types/issues/githubAssigneesRequest.js"
import { GitHubCreateBranchRequestDataType } from "./data_types/repositories/githubBranchRequests.js"
import { GitHubCheckRunDataType, GitHubCommitStatusDataType } from "./data_types/ciAutomation/githubCiAutomation.js"
import {
    GitHubCreateCheckRunRequestDataType,
    GitHubCreateCommitStatusRequestDataType,
    GitHubUpdateCheckRunRequestDataType,
} from "./data_types/ciAutomation/githubCiAutomationRequests.js"
import { GitHubCommitDataType } from "./data_types/repositories/githubCommit.js"
import { GitHubIssueCommentDataType } from "./data_types/issueComments/githubIssueComment.js"
import { GitHubCreateIssueCommentRequestDataType, GitHubUpdateIssueCommentRequestDataType } from "./data_types/issueComments/githubIssueCommentRequests.js"
import { GitHubCreateIssueRequestDataType, GitHubUpdateIssueRequestDataType } from "./data_types/issues/githubIssueRequests.js"
import { GitHubLabelDataType } from "./data_types/labels/githubLabel.js"
import { GitHubIssueLabelsRequestDataType } from "./data_types/labels/githubLabelRequests.js"
import { GitHubMilestoneDataType } from "./data_types/milestones/githubMilestone.js"
import { GitHubCreateMilestoneRequestDataType, GitHubUpdateMilestoneRequestDataType } from "./data_types/milestones/githubMilestoneRequests.js"
import { GitHubPullRequestDataType } from "./data_types/pullRequests/githubPullRequest.js"
import { GitHubPullRequestMergeRequestDataType, GitHubPullRequestMergeResultDataType } from "./data_types/pullRequests/githubPullRequestMergeRequest.js"
import { GitHubPullRequestReviewCommentDataType } from "./data_types/pullRequestReviewComments/githubPullRequestReviewComment.js"
import {
    GitHubCreatePullRequestReviewCommentRequestDataType,
    GitHubUpdatePullRequestReviewCommentRequestDataType,
} from "./data_types/pullRequestReviewComments/githubPullRequestReviewCommentRequests.js"
import { GitHubPullRequestReviewDataType } from "./data_types/pullRequestReviews/githubPullRequestReview.js"
import {
    GitHubCreatePullRequestReviewRequestDataType,
    GitHubDismissPullRequestReviewRequestDataType,
    GitHubSubmitPullRequestReviewRequestDataType,
} from "./data_types/pullRequestReviews/githubPullRequestReviewRequests.js"
import { GitHubCreatePullRequestRequestDataType, GitHubUpdatePullRequestRequestDataType } from "./data_types/pullRequests/githubPullRequestRequests.js"
import { GitHubReleaseDataType } from "./data_types/releases/githubRelease.js"
import { GitHubCreateReleaseRequestDataType, GitHubUpdateReleaseRequestDataType } from "./data_types/releases/githubReleaseRequests.js"
import { GitHubRepositoryDataType } from "./data_types/repositories/githubRepository.js"
import { GitHubRepositoryBranchDataType } from "./data_types/repositories/githubRepositoryBranch.js"
import { GitHubWorkflowDataType, GitHubWorkflowRunDataType } from "./data_types/ciAutomation/githubWorkflow.js"
import { GitHubDispatchWorkflowRequestDataType } from "./data_types/ciAutomation/githubWorkflowRequests.js"
import { CreateIssueCommentFunction } from "./functions/issueComments/createIssueCommentFunction.js"
import { DeleteIssueCommentFunction } from "./functions/issueComments/deleteIssueCommentFunction.js"
import { GetIssueCommentsFunction } from "./functions/issueComments/getIssueCommentsFunction.js"
import { UpdateIssueCommentFunction } from "./functions/issueComments/updateIssueCommentFunction.js"
import { AddAssigneeToIssueFunction } from "./functions/issues/addAssigneeToIssueFunction.js"
import { AddAssigneesToIssueFunction } from "./functions/issues/addAssigneesToIssueFunction.js"
import { CloseIssueFunction } from "./functions/issues/closeIssueFunction.js"
import { CreateIssueFunction } from "./functions/issues/createIssueFunction.js"
import { GetIssueFunction } from "./functions/issues/getIssueFunction.js"
import { GetIssuesFunction } from "./functions/issues/getIssuesFunction.js"
import { ReopenIssueFunction } from "./functions/issues/reopenIssueFunction.js"
import { RemoveAssigneeFromIssueFunction } from "./functions/issues/removeAssigneeFromIssueFunction.js"
import { RemoveAssigneesFromIssueFunction } from "./functions/issues/removeAssigneesFromIssueFunction.js"
import { UpdateIssueFunction } from "./functions/issues/updateIssueFunction.js"
import { ClosePullRequestFunction } from "./functions/pullRequests/closePullRequestFunction.js"
import { CreatePullRequestFunction } from "./functions/pullRequests/createPullRequestFunction.js"
import { GetPullRequestFunction } from "./functions/pullRequests/getPullRequestFunction.js"
import { GetPullRequestsFunction } from "./functions/pullRequests/getPullRequestsFunction.js"
import { MergePullRequestFunction } from "./functions/pullRequests/mergePullRequestFunction.js"
import { ReopenPullRequestFunction } from "./functions/pullRequests/reopenPullRequestFunction.js"
import { UpdatePullRequestFunction } from "./functions/pullRequests/updatePullRequestFunction.js"
import { CreatePullRequestReviewFunction } from "./functions/pullRequestReviews/createPullRequestReviewFunction.js"
import { DismissPullRequestReviewFunction } from "./functions/pullRequestReviews/dismissPullRequestReviewFunction.js"
import { GetPullRequestReviewsFunction } from "./functions/pullRequestReviews/getPullRequestReviewsFunction.js"
import { SubmitPullRequestReviewFunction } from "./functions/pullRequestReviews/submitPullRequestReviewFunction.js"
import { CreatePullRequestReviewCommentFunction } from "./functions/pullRequestReviewComments/createPullRequestReviewCommentFunction.js"
import { DeletePullRequestReviewCommentFunction } from "./functions/pullRequestReviewComments/deletePullRequestReviewCommentFunction.js"
import { GetPullRequestReviewCommentsFunction } from "./functions/pullRequestReviewComments/getPullRequestReviewCommentsFunction.js"
import { UpdatePullRequestReviewCommentFunction } from "./functions/pullRequestReviewComments/updatePullRequestReviewCommentFunction.js"
import { CreateReleaseFunction } from "./functions/releases/createReleaseFunction.js"
import { DeleteReleaseFunction } from "./functions/releases/deleteReleaseFunction.js"
import { GetReleaseFunction } from "./functions/releases/getReleaseFunction.js"
import { GetReleasesFunction } from "./functions/releases/getReleasesFunction.js"
import { UpdateReleaseFunction } from "./functions/releases/updateReleaseFunction.js"
import { CreateBranchFunction } from "./functions/repositories/createBranchFunction.js"
import { DeleteBranchFunction } from "./functions/repositories/deleteBranchFunction.js"
import { GetBranchFunction } from "./functions/repositories/getBranchFunction.js"
import { GetCommitFunction } from "./functions/repositories/getCommitFunction.js"
import { GetCommitsFunction } from "./functions/repositories/getCommitsFunction.js"
import { GetRepositoryFunction } from "./functions/repositories/getRepositoryFunction.js"
import { GetRepositoryBranchesFunction } from "./functions/repositories/getRepositoryBranchesFunction.js"
import { CreateCheckRunFunction } from "./functions/ciAutomation/createCheckRunFunction.js"
import { CreateCommitStatusFunction } from "./functions/ciAutomation/createCommitStatusFunction.js"
import { CancelWorkflowRunFunction } from "./functions/ciAutomation/cancelWorkflowRunFunction.js"
import { DispatchWorkflowFunction } from "./functions/ciAutomation/dispatchWorkflowFunction.js"
import { GetCommitStatusesFunction } from "./functions/ciAutomation/getCommitStatusesFunction.js"
import { GetWorkflowRunsFunction } from "./functions/ciAutomation/getWorkflowRunsFunction.js"
import { GetWorkflowsFunction } from "./functions/ciAutomation/getWorkflowsFunction.js"
import { RerunWorkflowRunFunction } from "./functions/ciAutomation/rerunWorkflowRunFunction.js"
import { UpdateCheckRunFunction } from "./functions/ciAutomation/updateCheckRunFunction.js"
import { AddLabelsToIssueFunction } from "./functions/labels/addLabelsToIssueFunction.js"
import { GetIssueLabelsFunction } from "./functions/labels/getIssueLabelsFunction.js"
import { GetLabelsFunction } from "./functions/labels/getLabelsFunction.js"
import { RemoveAllLabelsFromIssueFunction } from "./functions/labels/removeAllLabelsFromIssueFunction.js"
import { RemoveLabelFromIssueFunction } from "./functions/labels/removeLabelFromIssueFunction.js"
import { SetLabelsForIssueFunction } from "./functions/labels/setLabelsForIssueFunction.js"
import { CreateMilestoneFunction } from "./functions/milestones/createMilestoneFunction.js"
import { DeleteMilestoneFunction } from "./functions/milestones/deleteMilestoneFunction.js"
import { GetMilestoneFunction } from "./functions/milestones/getMilestoneFunction.js"
import { GetMilestonesFunction } from "./functions/milestones/getMilestonesFunction.js"
import { UpdateMilestoneFunction } from "./functions/milestones/updateMilestoneFunction.js"

// import { GitHubPushWebhookPayloadDataType } from "./data_types/webhooks/githubPush.js"
// import { GitHubIssueClosedWebhookPayloadDataType } from "./data_types/webhooks/githubIssueClosedWebhookPayload.js"
// import { GitHubIssueOpenedWebhookPayloadDataType } from "./data_types/webhooks/githubIssueOpenedWebhookPayload.js"
// import { GitHubPullRequestClosedWebhookPayloadDataType } from "./data_types/webhooks/githubPullRequestClosedWebhookPayload.js"
// import { GitHubPullRequestOpenedWebhookPayloadDataType } from "./data_types/webhooks/githubPullRequestOpenedWebhookPayload.js"
//
// import { GitHubIssueClosedWebhook } from "./events/githubIssueClosedWebhook.js"
// import { GitHubIssueOpenedWebhook } from "./events/githubIssueOpenedWebhook.js"
// import { GitHubPullRequestClosedWebhook } from "./events/githubPullRequestClosedWebhook.js"
// import { GitHubPullRequestOpenedWebhook } from "./events/githubPullRequestOpenedWebhook.js"
// import { GitHubRepositoryPushWebhook } from "./events/githubRepositoryPushWebhook.js"

const action = new Action(
    process.env.ACTION_ID ?? "github-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "tabler:brand-github",
    "GitHub integration for retrieving repositories, issues, and pull requests.",
    [{ code: "en-US", content: "GitHub Action" }],
    [
        {
            identifier: "github_token",
            type: "TEXT",
            name: [{ code: "en-US", content: "GitHub token" }],
            description: [
                {
                    code: "en-US",
                    content: "Fine-grained GitHub access token used to authenticate API requests.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "github_api_url",
            type: "TEXT",
            defaultValue: "https://api.github.com",
            name: [{ code: "en-US", content: "GitHub API URL" }],
            description: [
                {
                    code: "en-US",
                    content: "Base URL of the GitHub REST API.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
)

action.registerDataTypeClass(GitHubRepositoryDataType)
action.registerDataTypeClass(GitHubRepositoryBranchDataType)
action.registerDataTypeClass(GitHubCreateBranchRequestDataType)
action.registerDataTypeClass(GitHubCommitDataType)
action.registerDataTypeClass(GitHubReleaseDataType)
action.registerDataTypeClass(GitHubCreateReleaseRequestDataType)
action.registerDataTypeClass(GitHubUpdateReleaseRequestDataType)
action.registerDataTypeClass(GitHubCommitStatusDataType)
action.registerDataTypeClass(GitHubCheckRunDataType)
action.registerDataTypeClass(GitHubCreateCommitStatusRequestDataType)
action.registerDataTypeClass(GitHubCreateCheckRunRequestDataType)
action.registerDataTypeClass(GitHubUpdateCheckRunRequestDataType)
action.registerDataTypeClass(GitHubWorkflowDataType)
action.registerDataTypeClass(GitHubWorkflowRunDataType)
action.registerDataTypeClass(GitHubDispatchWorkflowRequestDataType)
action.registerDataTypeClass(GitHubIssueDataType)
action.registerDataTypeClass(GitHubIssueCommentDataType)
action.registerDataTypeClass(GitHubLabelDataType)
action.registerDataTypeClass(GitHubIssueLabelsRequestDataType)
action.registerDataTypeClass(GitHubMilestoneDataType)
action.registerDataTypeClass(GitHubCreateMilestoneRequestDataType)
action.registerDataTypeClass(GitHubUpdateMilestoneRequestDataType)
action.registerDataTypeClass(GitHubCreateIssueRequestDataType)
action.registerDataTypeClass(GitHubUpdateIssueRequestDataType)
action.registerDataTypeClass(GitHubCreateIssueCommentRequestDataType)
action.registerDataTypeClass(GitHubUpdateIssueCommentRequestDataType)
action.registerDataTypeClass(GitHubAddAssigneesRequestDataType)
action.registerDataTypeClass(GitHubPullRequestDataType)
action.registerDataTypeClass(GitHubPullRequestMergeResultDataType)
action.registerDataTypeClass(GitHubPullRequestMergeRequestDataType)
action.registerDataTypeClass(GitHubPullRequestReviewDataType)
action.registerDataTypeClass(GitHubPullRequestReviewCommentDataType)
action.registerDataTypeClass(GitHubCreatePullRequestReviewCommentRequestDataType)
action.registerDataTypeClass(GitHubUpdatePullRequestReviewCommentRequestDataType)
action.registerDataTypeClass(GitHubCreatePullRequestRequestDataType)
action.registerDataTypeClass(GitHubUpdatePullRequestRequestDataType)
action.registerDataTypeClass(GitHubCreatePullRequestReviewRequestDataType)
action.registerDataTypeClass(GitHubSubmitPullRequestReviewRequestDataType)
action.registerDataTypeClass(GitHubDismissPullRequestReviewRequestDataType)

// action.registerDataTypeClass(GitHubPushWebhookPayloadDataType)
// action.registerDataTypeClass(GitHubIssueOpenedWebhookPayloadDataType)
// action.registerDataTypeClass(GitHubIssueClosedWebhookPayloadDataType)
// action.registerDataTypeClass(GitHubPullRequestOpenedWebhookPayloadDataType)
// action.registerDataTypeClass(GitHubPullRequestClosedWebhookPayloadDataType)

action.registerRuntimeFunction(GetRepositoryFunction)
action.registerRuntimeFunction(GetRepositoryBranchesFunction)
action.registerRuntimeFunction(GetBranchFunction)
action.registerRuntimeFunction(GetCommitsFunction)
action.registerRuntimeFunction(GetCommitFunction)
action.registerRuntimeFunction(CreateBranchFunction)
action.registerRuntimeFunction(DeleteBranchFunction)
action.registerRuntimeFunction(GetReleasesFunction)
action.registerRuntimeFunction(GetReleaseFunction)
action.registerRuntimeFunction(CreateReleaseFunction)
action.registerRuntimeFunction(UpdateReleaseFunction)
action.registerRuntimeFunction(DeleteReleaseFunction)
action.registerRuntimeFunction(CreateCommitStatusFunction)
action.registerRuntimeFunction(GetCommitStatusesFunction)
action.registerRuntimeFunction(CreateCheckRunFunction)
action.registerRuntimeFunction(UpdateCheckRunFunction)
action.registerRuntimeFunction(GetWorkflowsFunction)
action.registerRuntimeFunction(GetWorkflowRunsFunction)
action.registerRuntimeFunction(RerunWorkflowRunFunction)
action.registerRuntimeFunction(CancelWorkflowRunFunction)
action.registerRuntimeFunction(DispatchWorkflowFunction)
action.registerRuntimeFunction(GetIssueFunction)
action.registerRuntimeFunction(GetIssuesFunction)
action.registerRuntimeFunction(GetLabelsFunction)
action.registerRuntimeFunction(GetIssueLabelsFunction)
action.registerRuntimeFunction(AddLabelsToIssueFunction)
action.registerRuntimeFunction(SetLabelsForIssueFunction)
action.registerRuntimeFunction(RemoveLabelFromIssueFunction)
action.registerRuntimeFunction(RemoveAllLabelsFromIssueFunction)
action.registerRuntimeFunction(GetMilestonesFunction)
action.registerRuntimeFunction(GetMilestoneFunction)
action.registerRuntimeFunction(CreateMilestoneFunction)
action.registerRuntimeFunction(UpdateMilestoneFunction)
action.registerRuntimeFunction(DeleteMilestoneFunction)
action.registerRuntimeFunction(GetIssueCommentsFunction)
action.registerRuntimeFunction(CreateIssueCommentFunction)
action.registerRuntimeFunction(UpdateIssueCommentFunction)
action.registerRuntimeFunction(DeleteIssueCommentFunction)
action.registerRuntimeFunction(GetPullRequestFunction)
action.registerRuntimeFunction(GetPullRequestsFunction)
action.registerRuntimeFunction(GetPullRequestReviewsFunction)
action.registerRuntimeFunction(CreateIssueFunction)
action.registerRuntimeFunction(UpdateIssueFunction)
action.registerRuntimeFunction(CloseIssueFunction)
action.registerRuntimeFunction(ReopenIssueFunction)
action.registerRuntimeFunction(AddAssigneeToIssueFunction)
action.registerRuntimeFunction(AddAssigneesToIssueFunction)
action.registerRuntimeFunction(RemoveAssigneeFromIssueFunction)
action.registerRuntimeFunction(RemoveAssigneesFromIssueFunction)
action.registerRuntimeFunction(CreatePullRequestFunction)
action.registerRuntimeFunction(UpdatePullRequestFunction)
action.registerRuntimeFunction(ClosePullRequestFunction)
action.registerRuntimeFunction(ReopenPullRequestFunction)
action.registerRuntimeFunction(MergePullRequestFunction)
action.registerRuntimeFunction(CreatePullRequestReviewFunction)
action.registerRuntimeFunction(SubmitPullRequestReviewFunction)
action.registerRuntimeFunction(DismissPullRequestReviewFunction)
action.registerRuntimeFunction(GetPullRequestReviewCommentsFunction)
action.registerRuntimeFunction(CreatePullRequestReviewCommentFunction)
action.registerRuntimeFunction(UpdatePullRequestReviewCommentFunction)
action.registerRuntimeFunction(DeletePullRequestReviewCommentFunction)

// action.registerEventClass(GitHubRepositoryPushWebhook)
// action.registerEventClass(GitHubPullRequestOpenedWebhook)
// action.registerEventClass(GitHubPullRequestClosedWebhook)
// action.registerEventClass(GitHubIssueOpenedWebhook)
// action.registerEventClass(GitHubIssueClosedWebhook)

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to Aquila")
})

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message)
    console.log("Attempting to reconnect in 5s...")

    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "token_abc1234").catch((reconnectError: unknown) => {
            console.error("Reconnect failed:", reconnectError)
        })
    }, 5000)
})

action.connect(process.env.AUTH_TOKEN ?? "token_abc1234").catch((error: unknown) => {
    console.error("Failed to connect:", error)
    process.exit(1)
})

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, { depth: null })
    console.dir(action.configs.values(), { depth: null })
})

export { action }
