const express = require("express");
const getAuthenticatedUser = require("../middlewares/userAuth");
const ensureRoleNotAssigned = require("../middlewares/checkRole");

const editorController = require("../controllers/editorController");
const creatorController = require("../controllers/creatorController");
const assignmentController = require("../controllers/assignmentController");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.post(
  "/assign-editor-req",
  getAuthenticatedUser,
  assignmentController.sendAssignmentRequest
);

router.get(
  "/assign-editor-req",
  getAuthenticatedUser,
  assignmentController.getAssignmentRequest
);

router.post(
  "/accept-req/:requestId/accept",
  getAuthenticatedUser,
  assignmentController.acceptAssignmentRequest
);

router.get("/editors", getAuthenticatedUser, editorController.getEditors);

router.get(
  "/assigned-editors",
  getAuthenticatedUser,
  editorController.getAssignedEditors
);


router.get(
  "/assigned-creators",
  getAuthenticatedUser,
  creatorController.getAssignedCreators
);

router.post("/create-task", getAuthenticatedUser, taskController.createTask);
router.get("/get-task", getAuthenticatedUser, taskController.getTasks);
module.exports = router;
