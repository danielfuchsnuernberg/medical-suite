// B76 (A7): reading the June app's people (invented names here, shaped like the June file).
import { describe, it, expect } from "vitest";
import { juneStaff, professionFromJob } from "../src";

const html = `<script>function seed(){ const personnel=[
    p({id:'PR-1',title:'Dr.',firstName:'Alex',lastName:'Sample',jobRole:'Physician',department:'Maternity',email:'alex@example.org',trainingRecords:[tr('CT-1','Completed',{completedDate:dISO(-200)})]}),
    p({id:'PR-2',firstName:'Bea',lastName:'O\\'Test',jobRole:'Midwife',department:'Maternity',email:'bea@example.org',trainingRecords:[]}),
    p({id:'PR-3',firstName:'System',lastName:'Administrator',jobRole:'Administrator',email:'admin@example.org',trainingRecords:[]}),
    p({id:'PR-4',firstName:'Cy',lastName:'Example',jobRole:'Driver',email:'',trainingRecords:[]})
  ];</script>`;

describe("B76 June people", () => {
  it("names with title, jobs, emails; the placeholder left out; no training or departments", () => {
    const ppl = juneStaff(html);
    expect(ppl).toEqual([
      { juneId: "PR-1", name: "Dr. Alex Sample", job: "Physician", email: "alex@example.org", profession: "Doctor" },
      { juneId: "PR-2", name: "Bea O'Test", job: "Midwife", email: "bea@example.org", profession: "Nurse" },
      { juneId: "PR-4", name: "Cy Example", job: "Driver", email: "", profession: "Other" },
    ]);
    expect(JSON.stringify(ppl)).not.toMatch(/Maternity|CT-1|training/i);
  });
  it("not the June app: nothing", () => { expect(juneStaff("<html>hello</html>")).toEqual([]); });
  it("profession from the job", () => {
    expect(professionFromJob("Charge Nurse")).toBe("Nurse");
    expect(professionFromJob("Medical Officer")).toBe("Doctor");
    expect(professionFromJob("Base manager")).toBe("Other");
  });
});
