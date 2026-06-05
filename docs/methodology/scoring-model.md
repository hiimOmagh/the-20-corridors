# Scoring Model

## Rule

Each selected answer has:

- one primary tag
- zero or more secondary tags
- a question weight

## Tag scoring

| Tag position | Score |
|---|---:|
| Primary tag | question weight × 1.0 |
| Secondary tag 1 | question weight × 0.6 |
| Secondary tag 2 | question weight × 0.4 |
| Secondary tag 3 | question weight × 0.3 |

## Example

Q2A:

```text
Question weight = 1.5
Primary: EXP
Secondary 1: RISK
Secondary 2: ACT
```

Score:

```text
EXP = +1.5
RISK = +0.9
ACT = +0.6
```

## Question weights

| Q | Short label | Weight |
|---:|---|---:|
| 1 | Strange city | 1.00 |
| 2 | Locked box | 1.50 |
| 3 | Road choice | 1.00 |
| 4 | Free hour | 1.00 |
| 5 | Animal | 1.00 |
| 6 | Group game | 1.00 |
| 7 | Lost in forest | 1.50 |
| 8 | Comfort place | 0.75 |
| 9 | Mysterious key | 1.25 |
| 10 | Film character | 1.00 |
| 11 | Power outage | 1.50 |
| 12 | Element | 0.75 |
| 13 | Book type | 1.00 |
| 14 | Travel irritation | 1.00 |
| 15 | Island | 1.25 |
| 16 | Strange sound | 1.50 |
| 17 | Color | 0.75 |
| 18 | Winning | 1.00 |
| 19 | Superpower | 2.00 |
| 20 | Final door | 2.00 |

## Banding

Use bands, not fake precision.

| Band | Meaning |
|---|---|
| Low | weak or rare signal |
| Moderate | present but not dominant |
| High | repeated across several questions |
| Dominant | one of the strongest repeated signals |

Do not output fake percentages such as `87.3% strategic`.
