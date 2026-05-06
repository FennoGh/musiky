# Project pre-delete cascade was needed in the legacy Prisma schema where
# Payout had no ON DELETE CASCADE from Project. Django's CASCADE FK on
# Payout.project handles it now — left as a placeholder in case future
# audit/clean-up logic needs to hook the same point.
