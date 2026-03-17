---
name: sequential-thinking
description: Performs dynamic, reflective problem-solving through iterative thought chains. Use for complex planning requiring revision, branching, backtracking, or hypothesis verification. Ideal for multi-step analysis where context maintenance is required or the full scope isn't initially clear.
---

# Sequential Thinking

A structured approach to complex problem-solving that breaks down challenges into iterative thought steps with built-in flexibility for revision and course correction.

## When to Use This Skill

- Breaking down complex problems into manageable steps
- Planning and design requiring iterative refinement
- Analysis that might need course correction mid-stream
- Problems where the full scope emerges during analysis
- Multi-step solutions requiring context across steps
- Filtering out irrelevant information
- Hypothesis generation and verification workflows

## Core Methodology

Sequential thinking follows a dynamic process:

1. **Initial estimation**: Start with an estimate of thoughts needed, but remain flexible
2. **Iterative analysis**: Work through thoughts sequentially while building context
3. **Revision capability**: Question or revise previous thoughts as understanding deepens
4. **Branch exploration**: Explore alternative approaches when needed
5. **Hypothesis cycle**: Generate hypotheses, verify against thought chain, repeat
6. **Convergence**: Continue until reaching a satisfactory solution

## Instructions

### Thought Structure

Each thought in the sequence should include:

- **thought**: Current thinking step content
- **thoughtNumber**: Position in sequence (1, 2, 3, ...)
- **totalThoughts**: Current estimate of total thoughts needed (adjustable)
- **nextThoughtNeeded**: Whether another thought step is required

Optional revision/branching metadata:
- **isRevision**: Boolean indicating if reconsidering previous thinking
- **revisesThought**: Which thought number is being revised
- **branchFromThought**: Branching point thought number
- **branchId**: Identifier for current branch
- **needsMoreThoughts**: Flag when reaching end but requiring more analysis

### Process Guidelines

**Starting out:**
- Estimate initial thoughts needed based on problem complexity
- Begin with thought 1, establishing context and approach
- Set totalThoughts conservatively; you can adjust later

**During analysis:**
- Build on previous thoughts while maintaining context
- Filter out irrelevant information at each step
- Express uncertainty when present
- Don't hesitate to revise if you spot errors or better approaches
- Adjust totalThoughts up/down as the problem's scope becomes clearer

**Revision pattern:**
When reconsidering previous thinking:
```json
{
  "thought": "On reflection, thought 3's assumption about X was incorrect because Y...",
  "thoughtNumber": 6,
  "totalThoughts": 10,
  "isRevision": True,
  "revisesThought": 3,
  "nextThoughtNeeded": True
}
```

**Hypothesis cycle:**
1. Generate hypothesis based on current understanding
2. Verify against previous thought chain
3. If verification fails, revise or branch
4. Repeat until hypothesis is validated

**Completion:**
- Only set `nextThoughtNeeded: False` when truly satisfied with the solution
- Provide a single, clear final answer
- Ensure the answer directly addresses the original problem

### Working with Context

**Maintain continuity:**
- Reference specific previous thoughts by number
- Build logical connections between thoughts
- Track which thoughts are still valid vs. revised

**Filter information:**
- Ignore details irrelevant to current thought step
- Focus on information that advances understanding
- Re-evaluate relevance as context evolves

**Manage complexity:**
- If a thought becomes too complex, break it into multiple thoughts
- Increase totalThoughts estimate accordingly
- Keep each individual thought focused

### Output Format

Present your sequential thinking in a structured format:
```
Thought [N/Total]: [Current thought content]
[If revision: "This revises thought X because..."]
[If branching: "Branching from thought X to explore..."]

[Continue with next thought when nextThoughtNeeded is True]

Final output after all thoughts complete:
Solution: [Clear, direct answer to the original problem]

```

## Examples

For concrete examples of sequential thinking in action, see `resources/examples.md`.

## Key Principles

- **Flexibility over rigidity**: Adjust your approach as understanding deepens
- **Revision is strength**: Correcting course shows good reasoning
- **Hypothesis-driven**: Generate and test hypotheses iteratively
- **Context-aware**: Maintain awareness of previous thoughts while progressing
- **Clarity at completion**: Deliver a single, clear final answer
