namespace :db do
  namespace :seed do
    desc "Compare one-row-at-a-time inserts with the batched seeder on 1,000 rows, then seed 10,000"
    task benchmark: :environment do
      measure = lambda do |label, &block|
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        block.call
        elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at
        puts format("%-36s %8.3fs", label, elapsed)
      end

      seeder = EmployeeSeeder.new(count: 1_000)
      rows = seeder.rows

      Employee.delete_all
      measure.call("1,000 rows, create! one at a time") { rows.each { |row| Employee.create!(row) } }
      measure.call("1,000 rows, batched seeder") { seeder.call }
      measure.call("10,000 rows, batched seeder") { EmployeeSeeder.new.call }
    end
  end
end
