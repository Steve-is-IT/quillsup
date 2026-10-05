# © 2026 Competence Collective. Lesson text and teaching materials CC BY-NC 4.0. The Hackles name, logos, characters and artwork are not covered by that license: print and share them unaltered for classroom and family use; any other use needs written permission. [VERIFY with counsel]
# Hackles research toolkit: R version of the primary analysis (base R only).
# STATUS: NOT RUN. R was not installed in the environment where this toolkit was built, so this script has not been executed.
# It mirrors analyze_tallies.py and analyze_candidates.py. Run the Python scripts, then run this script and compare with
# expected_output.txt. Exact quantities (percents, Welch t, exact randomization p, McNemar exact p, paired t) should match.
# Bootstrap intervals will differ a little because R and Python use different random number generators.
# Usage (from this folder):  Rscript analysis.R

tallies <- read.csv("data/synthetic_class_tallies_6-8.csv", stringsAsFactors = FALSE)
cands   <- read.csv("data/synthetic_candidates_academy_survey.csv", stringsAsFactors = FALSE)

min_cell <- 10   # suppress groups smaller than this [VERIFY your district rule]

# ---------------------------------------------------------------- 1. class-level tally analysis
tell_pct <- function(best, answered) 100 * best / answered
tallies$tr_pre  <- tell_pct(tallies$core_pre_best,  tallies$core_pre_answered)
tallies$tr_post <- tell_pct(tallies$core_post_best, tallies$core_post_answered)
tallies$change  <- tallies$tr_post - tallies$tr_pre

for (cond in c("taught_first", "delayed")) {
  d <- tallies[tallies$condition == cond, ]
  cat("\n==", cond, "==\n")
  if (min(sum(d$n_pre), sum(d$n_post)) < min_cell) { cat("SUPPRESSED\n"); next }
  pre  <- 100 * sum(d$core_pre_best)  / sum(d$core_pre_answered)
  post <- 100 * sum(d$core_post_best) / sum(d$core_post_answered)
  cat(sprintf("Tell-Readiness pre %.0f%%, post %.0f%%, change %+.0f points\n", pre, post, post - pre))
  up <- sum(d$matched_up); down <- sum(d$matched_down); same <- sum(d$matched_same)
  cat(sprintf("matched pairs: up %d, same %d, down %d\n", up, same, down))
  if (up + down > 0) cat(sprintf("exact sign test up vs down p = %.4f\n", binom.test(min(up, down), up + down, 0.5)$p.value))
}

a <- tallies$change[tallies$condition == "taught_first"]
b <- tallies$change[tallies$condition == "delayed"]
cat(sprintf("\ndifference in mean class change: %+.1f points\n", mean(a) - mean(b)))
w <- t.test(a, b)                       # Welch by default
cat(sprintf("Welch t = %.2f (df %.1f), p = %.3f\n", w$statistic, w$parameter, w$p.value))
all_change <- c(a, b); na <- length(a)
obs <- abs(mean(a) - mean(b))
idx <- combn(length(all_change), na)
perm <- apply(idx, 2, function(i) abs(mean(all_change[i]) - mean(all_change[-i])))
cat(sprintf("exact randomization p (all %d relabelings) = %.3f\n", ncol(idx), mean(perm >= obs - 1e-12)))
set.seed(7)
cls <- data.frame(change = tallies$change, cond = tallies$condition)
boot <- replicate(4000, { s <- cls[sample(nrow(cls), replace = TRUE), ]
  if (length(unique(s$cond)) < 2) NA else mean(s$change[s$cond == "taught_first"]) - mean(s$change[s$cond == "delayed"]) })
cat(sprintf("bootstrap 95%% interval (resampling classes): %+.1f to %+.1f\n", quantile(boot, 0.025, na.rm = TRUE), quantile(boot, 0.975, na.rm = TRUE)))

# ---------------------------------------------------------------- 2. teacher candidates
pre  <- cands[cands$wave == "pre", ];  post <- cands[cands$wave == "post", ]
pre  <- pre[order(pre$candidate_id), ]; post <- post[order(post$candidate_id), ]
A <- paste0("a", 1:18)
d <- rowMeans(post[, A]) - rowMeans(pre[, A])
cat(sprintf("\ncandidates: n = %d, mean change in Part A = %+.2f\n", length(d), mean(d)))
tt <- t.test(d)
cat(sprintf("paired t = %.2f (df %d), p = %s; Cohen's dz = %.2f\n", tt$statistic, tt$parameter, format.pval(tt$p.value, digits = 3, eps = 1e-4), mean(d) / sd(d)))
set.seed(2)
bm <- replicate(5000, mean(sample(d, replace = TRUE)))
cat(sprintf("bootstrap 95%% interval: %+.2f to %+.2f\n", quantile(bm, 0.025), quantile(bm, 0.975)))
K <- paste0("k", 1:5)
kd <- rowSums(post[, K]) - rowSums(pre[, K])
cat(sprintf("knowledge snapshot: mean change %+.2f\n", mean(kd)))

# ---------------------------------------------------------------- 3. optional (needs the lme4 package; not run)
# student <- read.csv("data/synthetic_student_level_6-8.csv")
# library(lme4)
# m <- lmer(core ~ condition * wave + (1 | class_id) + (1 | student_code), data = student)   # after computing 'core'
# summary(m)
