import Stryker from "@stryker-mutator/core";
import { exec } from "child_process";
import { join } from "path";

import run from "@src/index";

jest.mock("@stryker-mutator/api/config");
jest.mock("@stryker-mutator/core");
jest.mock("child_process");

describe("Stryker diff runner", () => {
  let mockedConfig: any;
  let mockedStrykerInstance: any;
  beforeEach(() => {
    mockedConfig = {
      mutate: [],
    };

    mockedStrykerInstance = {
      runMutationTest: jest.fn(),
    };

    mockStrykerConstruction(mockedConfig);
  });

  it("Should exit when file diff command gives an error.", () => {
    const exitMock = jest.spyOn(process, "exit").mockImplementation();

    run(["node", "exec"]);

    runFileDiffCommandCallback(new Error("NOPE"), "");

    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it("Should run mutation test with default loaded configuration when no args are provided to the run.", (done) => {
    run(["node", "exec"]);

    runFileDiffCommandCallback(null, "");

    setTimeout(() => {
      expect(mockedStrykerInstance.runMutationTest).toHaveBeenCalled();
      done();
    });
  });

  it('Should remove first line of the "mutate" config properties in order to avoid running stryker to full match files for mutations.', (done) => {
    const expectedConfig = {
      mutate: [],
    };
    jest.spyOn(process, "cwd").mockReturnValue(join(__dirname, "mock-stryker-conf", "one-line-mutate-config"));
    mockStrykerConstruction(expectedConfig);

    run(["node", "exec"]);

    runFileDiffCommandCallback(null, "");

    setTimeout(() => {
      expect(mockedStrykerInstance.runMutationTest).toHaveBeenCalled();
      done();
    });
  });

  it('Should concat file list from diff command to "mutate" config property.', (done) => {
    const fileDiffList = "file1\nfile2\nfile3\n";
    const expectedConfig = {
      mutate: ["file1", "file2", "file3"],
    };
    jest.spyOn(process, "cwd").mockReturnValue(join(__dirname, "mock-stryker-conf", "one-line-mutate-config"));
    mockStrykerConstruction(expectedConfig);
    run(["node", "exec"]);

    runFileDiffCommandCallback(null, fileDiffList);

    setTimeout(() => {
      expect(mockedStrykerInstance.runMutationTest).toHaveBeenCalled();
      done();
    });
  });

  it('Should exclude files from list diff command that are in the exclusion of the "mutate" config property.', (done) => {
    const fileDiffList = "file1\nfile2\nfile3\n";
    const expectedConfig = {
      mutate: ["!file3", "file1", "file2"],
    };
    jest.spyOn(process, "cwd").mockReturnValue(join(__dirname, "mock-stryker-conf", "mutate-config-with-exclusion"));
    mockStrykerConstruction(expectedConfig);

    run(["node", "exec"]);

    runFileDiffCommandCallback(null, fileDiffList);

    setTimeout(() => {
      expect(mockedStrykerInstance.runMutationTest).toHaveBeenCalled();
      done();
    });
  });

  it("Should concat command arguments and values to stryker configuration.", (done) => {
    const expectedConfig = {
      mutate: [],
      arg1: "arg1Value",
      arg2: "arg2Value",
    };
    mockStrykerConstruction(expectedConfig);

    run(["node", "exec", "--arg1", "arg1Value", "--arg2", "arg2Value"]);

    runFileDiffCommandCallback(null, "");

    setTimeout(() => {
      expect(mockedStrykerInstance.runMutationTest).toHaveBeenCalled();
      done();
    });
  });

  it("Should concat command arguments and numeric values as numeric values to stryker configuration.", (done) => {
    const expectedConfig = {
      mutate: [],
      arg1: 1,
      arg2: "arg2Value",
    };
    mockStrykerConstruction(expectedConfig);

    run(["node", "exec", "--arg1", "1", "--arg2", "arg2Value"]);

    runFileDiffCommandCallback(null, "");

    setTimeout(() => {
      expect(mockedStrykerInstance.runMutationTest).toHaveBeenCalled();
      done();
    });
  });

  it("Should concat command arguments and values to stryker configuration and replace existing ones.", (done) => {
    const expectedConfig = {
      mutate: [],
      arg1: "arg1Value",
      arg2: "arg2Value",
    };
    mockStrykerConstruction(expectedConfig);

    run(["node", "exec", "--arg1", "arg1Value", "--arg2", "arg2Value"]);

    runFileDiffCommandCallback(null, "");

    setTimeout(() => {
      expect(mockedStrykerInstance.runMutationTest).toHaveBeenCalled();
      done();
    });
  });

  function mockStrykerConstruction(expectedConfig: any) {
    (Stryker as jest.Mock).mockImplementation((config) => {
      if (JSON.stringify(config) === JSON.stringify(expectedConfig)) {
        return mockedStrykerInstance;
      }
    });
  }

  function runFileDiffCommandCallback(error: Error | null, fileDiffList: string) {
    (exec as any).mock.calls[0][1](error, fileDiffList);
  }
});
