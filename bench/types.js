import {Type as T} from '@sinclair/typebox'
import * as S from 'superstruct'
import {z as Z} from 'zod'
import * as C from '../dist/index.js'

export const cito = C.object({
  data: C.object({
    launchesPast: C.array(
      C.object({
        mission_name: C.string,
        launch_date_local: C.string,
        launch_site: C.object({
          site_name_long: C.string
        }),
        links: C.object({
          article_link: C.nullable(C.string),
          video_link: C.string
        }),
        rocket: C.object({
          rocket_name: C.string,
          first_stage: C.object({
            cores: C.array(
              C.object({
                flight: C.number,
                core: C.object({
                  reuse_count: C.number,
                  status: C.nullable(C.string)
                })
              })
            )
          }),
          second_stage: C.object({
            payloads: C.array(
              C.object({
                payload_type: C.string,
                payload_mass_kg: C.nullable(C.number),
                payload_mass_lbs: C.nullable(C.number)
              })
            )
          })
        }),
        ships: C.array(
          C.object({
            name: C.string,
            home_port: C.string,
            image: C.string
          })
        )
      })
    )
  })
})

export const typebox = T.Object({
  data: T.Object({
    launchesPast: T.Array(
      T.Object({
        mission_name: T.String(),
        launch_date_local: T.String(),
        launch_site: T.Object({
          site_name_long: T.String()
        }),
        links: T.Object({
          article_link: T.Union([T.Null(), T.String()]),
          video_link: T.String()
        }),
        rocket: T.Object({
          rocket_name: T.String(),
          first_stage: T.Object({
            cores: T.Array(
              T.Object({
                flight: T.Number(),
                core: T.Object({
                  reuse_count: T.Number(),
                  status: T.Union([T.Null(), T.String()])
                })
              })
            )
          }),
          second_stage: T.Object({
            payloads: T.Array(
              T.Object({
                payload_type: T.String(),
                payload_mass_kg: T.Union([T.Null(), T.Number()]),
                payload_mass_lbs: T.Union([T.Null(), T.Number()])
              })
            )
          })
        }),
        ships: T.Array(
          T.Object({
            name: T.String(),
            home_port: T.String(),
            image: T.String()
          })
        )
      })
    )
  })
})

export const superstruct = S.object({
  data: S.object({
    launchesPast: S.array(
      S.object({
        mission_name: S.string(),
        launch_date_local: S.string(),
        launch_site: S.object({
          site_name_long: S.string()
        }),
        links: S.object({
          article_link: S.nullable(S.string()),
          video_link: S.string()
        }),
        rocket: S.object({
          rocket_name: S.string(),
          first_stage: S.object({
            cores: S.array(
              S.object({
                flight: S.number(),
                core: S.object({
                  reuse_count: S.number(),
                  status: S.nullable(S.string())
                })
              })
            )
          }),
          second_stage: S.object({
            payloads: S.array(
              S.object({
                payload_type: S.string(),
                payload_mass_kg: S.nullable(S.number()),
                payload_mass_lbs: S.nullable(S.number())
              })
            )
          })
        }),
        ships: S.array(
          S.object({
            name: S.string(),
            home_port: S.string(),
            image: S.string()
          })
        )
      })
    )
  })
})

export const zod = Z.object({
  data: Z.object({
    launchesPast: Z.array(
      Z.object({
        mission_name: Z.string(),
        launch_date_local: Z.string(),
        launch_site: Z.object({
          site_name_long: Z.string()
        }),
        links: Z.object({
          article_link: Z.nullable(Z.string()),
          video_link: Z.string()
        }),
        rocket: Z.object({
          rocket_name: Z.string(),
          first_stage: Z.object({
            cores: Z.array(
              Z.object({
                flight: Z.number(),
                core: Z.object({
                  reuse_count: Z.number(),
                  status: Z.nullable(Z.string())
                })
              })
            )
          }),
          second_stage: Z.object({
            payloads: Z.array(
              Z.object({
                payload_type: Z.string(),
                payload_mass_kg: Z.nullable(Z.number()),
                payload_mass_lbs: Z.nullable(Z.number())
              })
            )
          })
        }),
        ships: Z.array(
          Z.object({
            name: Z.string(),
            home_port: Z.string(),
            image: Z.string()
          })
        )
      })
    )
  })
})
