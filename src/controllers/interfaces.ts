export type ExpectedParametersCommon = {
    what: "md" | "andev" | "json" | "ibooks",
    config?: string
}

export type ExpectedParametersEgress = {
    path: string,
    batch: string,
    notebook: string,
    diff?: number,
    flipped?: boolean
} & ExpectedParametersCommon

export type ExpectedParametersIngress = {
    batch?: string,
    notebook?: string,
    book?: string,
    file?: string,
    resource?: string
} & ExpectedParametersCommon
