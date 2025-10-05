import { createTest } from "@/features/test/routes/create-test";
import { deleteTest } from "@/features/test/routes/delete-test";
import { listAllTests } from "@/features/test/routes/list-all-tests";
import { updateTest } from "@/features/test/routes/update-test";

const testRouter = {
  listAllTests,
  createTest,
  updateTest,
  deleteTest,
};

export default testRouter;
