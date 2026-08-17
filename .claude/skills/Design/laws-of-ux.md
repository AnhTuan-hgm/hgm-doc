# Laws of UX

Use this skill to audit, critique, or guide UI/UX design decisions using the 30 Laws of UX from lawsofux.com. When invoked, apply the relevant laws to the user's design problem, component, or screen. Surface which laws are being violated or honored, and give concrete, actionable recommendations.

## How to use this skill

When invoked via `/laws-of-ux`, do the following:

1. Identify what the user is designing, reviewing, or asking about (a form, nav bar, onboarding flow, modal, etc.)
2. Select the most relevant laws from the reference below — don't dump all 30 at the user
3. For each relevant law: state the law, note whether the current design honors or violates it, and give a specific recommendation
4. Prioritize laws with the highest impact on the user's specific context
5. If no design is provided, ask what component or flow they're working on, then guide them

---

## Reference: All 30 Laws of UX

### 1. Aesthetic-Usability Effect
**Definition:** "Users often perceive aesthetically pleasing design as design that's more usable."
**Key takeaways:**
- Visually attractive designs create a bias where users believe they work better
- Users tolerate minor usability issues in beautiful interfaces
- Beautiful UIs can mask usability problems during testing
**Apply when:** Justifying investment in visual polish; auditing whether aesthetics are hiding real UX debt

---

### 2. Choice Overload
**Definition:** The tendency to feel overwhelmed and paralyzed when presented with too many options.
**Key takeaways:**
- More choices = more cognitive burden = decision paralysis
- Reduce options to what is truly necessary
- Progressive disclosure helps manage complexity
**Apply when:** Designing menus, pricing pages, settings screens, or any multi-option selection

---

### 3. Chunking
**Definition:** "A process by which individual pieces of an information set are broken down and grouped together in a meaningful whole."
**Key takeaways:**
- Chunking lets users scan and find information faster
- Group content into visually separate sections with clear hierarchy
- Creates clarity by making relationships between elements explicit
**Apply when:** Designing forms, dashboards, long-content pages, or data-heavy interfaces

---

### 4. Cognitive Bias
**Definition:** Systematic errors in thinking that influence how users perceive and make decisions in an interface.
**Key takeaways:**
- Users don't behave rationally — design for how people actually think, not how they should think
- Biases like anchoring, social proof, and loss aversion can be ethically leveraged
- Avoid dark patterns that exploit biases against user interest
**Apply when:** Designing pricing, CTAs, onboarding flows, or social features

---

### 5. Cognitive Load
**Definition:** "The amount of mental resources needed to understand and interact with an interface."
**Three types:**
- **Intrinsic load** — effort required to process relevant content
- **Extraneous load** — effort wasted on poor design (unnecessary elements, unclear labels)
- **Information overload** — when input exceeds available mental capacity
**Key takeaways:**
- Minimize extraneous load by removing unnecessary UI elements
- Break complex tasks into smaller steps
- Use progressive disclosure to reveal information when needed
**Apply when:** Reviewing any interface — reducing cognitive load is always relevant

---

### 6. Doherty Threshold
**Definition:** "Productivity soars when a computer and its users interact at a pace (<400ms) that ensures neither has to wait on the other."
**Key takeaways:**
- System feedback must arrive within 400ms to maintain user focus
- Use optimistic UI updates, skeleton screens, and progress indicators to manage perceived wait time
- Strategic artificial delays can increase perceived quality/value
- Animations during loading keep users engaged
**Apply when:** Auditing perceived performance, loading states, async operations, or form submissions

---

### 7. Fitts's Law
**Definition:** "The time to acquire a target is a function of the distance to and size of the target."
**Key takeaways:**
- Make touch/click targets large enough to hit accurately (minimum 44×44px on mobile)
- Keep adequate spacing between targets to prevent mis-taps
- Place high-frequency actions close to where users' attention already is
- Small + far = slow + error-prone
**Apply when:** Designing buttons, nav items, form controls, mobile interfaces, or any interactive element

---

### 8. Flow
**Definition:** A state of complete immersion and focused engagement in an activity.
**Key takeaways:**
- Flow requires a balance between challenge and skill level
- Interruptions, confusion, and friction break flow
- Clear goals and immediate feedback sustain flow
**Apply when:** Designing onboarding, editing tools, games, or productivity interfaces

---

### 9. Goal-Gradient Effect
**Definition:** "The tendency to approach a goal increases with proximity to the goal."
**Key takeaways:**
- Users accelerate as they get closer to completion
- Show artificial progress early (e.g., a progress bar that starts at 20%) to boost motivation
- Progress visibility encourages task completion
**Apply when:** Designing multi-step flows, onboarding, progress bars, checkout, or loyalty programs

---

### 10. Hick's Law
**Definition:** "The time it takes to make a decision increases with the number and complexity of choices."
**Key takeaways:**
- Reduce decision time by minimizing the number of options
- Categorize and organize options to simplify choices
- Highlight recommended options to shortcut decision-making
- Don't oversimplify to the point of removing useful functionality
**Apply when:** Navigation design, settings, pricing pages, search results, or any multi-choice UI

---

### 11. Jakob's Law
**Definition:** "Users spend most of their time on other sites. They prefer your site to work the same way as all the other sites they already know."
**Key takeaways:**
- Leverage established conventions (hamburger menu, shopping cart icon, etc.)
- Don't reinvent patterns without strong reason — novelty creates friction
- When redesigning, allow users to access the old version temporarily
**Apply when:** Designing navigation, layout structure, forms, or any convention-heavy pattern

---

### 12. Law of Common Region
**Definition:** "Elements tend to be perceived as grouped if they share an area with a clearly defined boundary."
**Key takeaways:**
- Use borders, backgrounds, and cards to group related elements
- Common region establishes visual hierarchy and section relationships
- Both borders and background fills create grouping
**Apply when:** Designing cards, modals, sidebars, dashboards, or any sectioned layout

---

### 13. Law of Proximity
**Definition:** "Objects that are near, or proximate to each other, tend to be grouped together."
**Key takeaways:**
- Spacing communicates relationships — close = related, far = unrelated
- Use whitespace deliberately to separate distinct sections
- Consistent spacing systems (8pt grid, etc.) encode meaning
**Apply when:** Any layout — this is one of the most foundational Gestalt principles

---

### 14. Law of Prägnanz
**Definition:** "People will perceive and interpret ambiguous or complex images as the simplest form possible."
**Key takeaways:**
- The brain defaults to the simplest interpretation of visual information
- Complex icons or illustrations will be simplified by the user's mind
- Use simple, clear shapes and iconography
**Apply when:** Designing icons, illustrations, logos, or any visual with potential for ambiguity

---

### 15. Law of Similarity
**Definition:** "The human eye tends to perceive similar elements as a complete picture, shape, or group, even if those elements are separated."
**Key takeaways:**
- Visual similarity (color, shape, size, orientation) signals shared function or category
- Links must look different from body text — similarity = same meaning
- Consistent visual language for related actions reinforces grouping
**Apply when:** Designing interactive elements, navigation, or any pattern-based component system

---

### 16. Law of Uniform Connectedness
**Definition:** "Elements that are visually connected are perceived as more related than elements with no connection."
**Key takeaways:**
- Use lines, arrows, shared color, or borders to signal relationships
- Connected elements are perceived as a unit
- Strong connector (visual link) > proximity alone for showing relationships
**Apply when:** Designing breadcrumbs, step indicators, data visualizations, timelines, or relational UI

---

### 17. Mental Model
**Definition:** "A compressed model based on what we think we know about a system and how it works."
**Key takeaways:**
- Users arrive with pre-formed expectations — design to match them
- Products that align with mental models require less learning
- Close the gap between designer assumptions and user mental models through research
**Apply when:** Architecting information, naming features, or designing any unfamiliar interaction pattern

---

### 18. Miller's Law
**Definition:** "The average person can only keep 7 (plus or minus 2) items in their working memory."
**Key takeaways:**
- Don't use "7" as a hard limit — the actual number varies by context and individual
- Chunk information to help users process and retain it
- Working memory is small; don't force users to remember things across steps
**Apply when:** Designing navigation menus, lists, forms, or any information-heavy layout

---

### 19. Occam's Razor
**Definition:** "Among competing hypotheses that predict equally well, the one with the fewest assumptions should be selected."
**Key takeaways:**
- Prevent complexity before it enters the design
- Eliminate every element you can while maintaining function
- Design is done when nothing more can be removed, not added
**Apply when:** Reviewing any UI — question every element's necessity

---

### 20. Paradox of the Active User
**Definition:** "Users never read manuals but start using software immediately."
**Key takeaways:**
- Users will act before they understand; design for this behavior
- Inline guidance, tooltips, and contextual help are more effective than documentation
- Default states and empty states must guide users without requiring them to "read first"
**Apply when:** Designing onboarding, empty states, first-use experiences, or complex tools

---

### 21. Pareto Principle
**Definition:** "For many events, roughly 80% of the effects come from 20% of the causes."
**Key takeaways:**
- 20% of features will be used 80% of the time — prioritize them
- Focus design effort on the interactions that matter most to most users
- Don't let edge-case features pollute the core experience
**Apply when:** Prioritizing features, simplifying navigation, or deciding what to cut

---

### 22. Parkinson's Law
**Definition:** "Any task will inflate until all of the available time is spent."
**Key takeaways:**
- Cap perceived time for tasks to reduce completion time
- Autofill, smart defaults, and saved info reduce task inflation
- If checkout feels like it could take 10 minutes, users treat it like a 10-minute task
**Apply when:** Designing forms, checkout flows, onboarding, or any multi-step task

---

### 23. Peak-End Rule
**Definition:** "People judge an experience largely based on how they felt at its peak and at its end, rather than the total sum or average of every moment."
**Key takeaways:**
- Design for memorable peaks (moments of delight, achievement, surprise)
- Design endings carefully — the final screen/state shapes the whole memory
- Negative peaks leave stronger impressions than positive ones
**Apply when:** Designing checkout confirmation, success states, error recovery, or onboarding completion

---

### 24. Postel's Law
**Definition:** "Be liberal in what you accept, and conservative in what you send."
**Key takeaways:**
- Accept varied user input — don't break on (555) 555-5555 vs 5555555555 phone formats
- Translate and normalize messy input; don't penalize users for format variation
- Output must be clean, precise, and conformant regardless of input flexibility
**Apply when:** Designing forms, search inputs, data entry, or any user-submitted content

---

### 25. Selective Attention
**Definition:** The process of focusing on relevant stimuli while filtering out irrelevant information in an environment.
**Key takeaways:**
- Users only see what they're looking for — design to intercept their attention
- Visual hierarchy guides where attention flows
- Unexpected changes (motion, contrast) break selective attention and can be used intentionally
**Apply when:** Designing notifications, CTAs, alerts, or any element competing for attention

---

### 26. Serial Position Effect
**Definition:** "Users have a propensity to best remember the first and last items in a series."
**Two effects:**
- **Primacy effect** — first items are remembered best (long-term memory)
- **Recency effect** — last items are remembered best (short-term memory)
**Key takeaways:**
- Place the most critical actions at the beginning and end of navigation or lists
- Middle positions are the weakest — reserve them for less important items
**Apply when:** Designing navigation bars, lists, menus, or step indicators

---

### 27. Tesler's Law (Law of Conservation of Complexity)
**Definition:** "For any system there is a certain amount of complexity which cannot be reduced."
**Key takeaways:**
- Complexity can be shifted but not eliminated — move it from the user to the system
- Invest dev effort so users don't have to think
- Provide contextual help regardless of user path; don't assume ideal behavior
**Apply when:** Simplifying complex workflows — complexity goes somewhere; put it in the product, not on the user

---

### 28. Von Restorff Effect (Isolation Effect)
**Definition:** "When multiple similar objects are present, the one that differs from the rest is most likely to be remembered."
**Key takeaways:**
- Make critical information and primary CTAs visually distinct
- Don't over-use emphasis — if everything stands out, nothing does
- Don't rely on color alone (accessibility); use shape, size, or position too
- Respect motion sensitivity when using animation for contrast
**Apply when:** Designing CTAs, pricing highlights, alerts, or any element that must stand out

---

### 29. Working Memory
**Definition:** The cognitive system responsible for temporarily holding and manipulating information needed for ongoing tasks.
**Key takeaways:**
- Working memory is severely limited — don't make users hold information across steps
- Avoid requiring users to memorize information from one screen to apply on another
- Inline labels, confirmation previews, and persistent context reduce working memory burden
**Apply when:** Designing multi-step flows, wizards, data entry, or complex interactive tasks

---

### 30. Zeigarnik Effect
**Definition:** "People remember uncompleted or interrupted tasks better than completed tasks."
**Key takeaways:**
- Incomplete tasks create cognitive tension that drives re-engagement
- Use progress indicators and "resume where you left off" patterns
- Artificial progress (starting a bar at 20%) creates commitment
**Apply when:** Designing onboarding flows, profile completion, streaks, or re-engagement features

---

## Quick-reference by design context

| Context | Most Relevant Laws |
|---|---|
| Navigation | Jakob's Law, Hick's Law, Serial Position Effect, Miller's Law |
| Forms | Fitts's Law, Postel's Law, Chunking, Cognitive Load, Parkinson's Law |
| Onboarding | Goal-Gradient, Zeigarnik, Paradox of Active User, Peak-End Rule |
| CTAs / Buttons | Von Restorff, Fitts's Law, Aesthetic-Usability, Serial Position |
| Loading / Performance | Doherty Threshold, Flow, Zeigarnik |
| Information Architecture | Law of Proximity, Common Region, Similarity, Chunking, Mental Model |
| Pricing Pages | Hick's Law, Von Restorff, Cognitive Bias, Pareto Principle |
| Mobile | Fitts's Law, Cognitive Load, Chunking, Miller's Law |
| Redesigns | Jakob's Law, Mental Model, Tesler's Law |
