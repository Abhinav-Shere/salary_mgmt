started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
count = EmployeeSeeder.new.call
elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at

puts "Seeded #{count} employees in #{elapsed.round(2)}s"
