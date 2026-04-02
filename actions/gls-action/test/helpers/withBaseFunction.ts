import {vi} from "vitest";
import {SdkMockState} from "../index.test";
import {withSdkMock} from "./withSdkMock";
import {ActionSdk} from "@code0-tech/hercules";

export const withBaseFunctionMock = async (
    register: (sdk: ActionSdk) => Promise<void>,
    tests: (state: SdkMockState) => void
) => {
    await withSdkMock(async (state) => {
        const {createSdk} = await import("@code0-tech/hercules")

        vi.doMock("../helpers.ts", async (importOriginal) => {
            const actual = await importOriginal() as any;

            return {
                ...actual,
                loadAllDefinitions: vi.fn(() => {
                    return Promise.resolve()
                })
            }
        })

        const mockSdk = createSdk(
            {
                actionId: "",
                version: "",
                aquilaUrl: "",
                authToken: ""
            }
        )

        vi.doMock("../index.ts", () => ({
            sdk: mockSdk
        }));

        vi.doMock("axios", () => {
            return {
                post: vi.fn(),
                get: vi.fn(),
                put: vi.fn(),
                delete: vi.fn(),
            };
        });

        try {
            await register(mockSdk)

            tests(state);

        } catch (error) {
            console.error(error)
        }
    })
}

