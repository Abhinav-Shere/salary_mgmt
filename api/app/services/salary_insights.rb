class SalaryInsights
  ROUNDED_AVERAGE = Arel.sql("CAST(ROUND(AVG(salary)) AS INTEGER)")
  AGGREGATES = {
    headcount: Arel.sql("COUNT(*)"),
    min_salary: Arel.sql("MIN(salary)"),
    max_salary: Arel.sql("MAX(salary)"),
    average_salary: ROUNDED_AVERAGE,
    total_payroll: Arel.sql("SUM(salary)")
  }.freeze
  MIDDLE_ROWS = "position IN ((group_size + 1) / 2, (group_size + 2) / 2)"

  def summary
    stats(Employee.all).merge(country_count: Employee.distinct.count(:country))
  end

  def countries
    grouped_stats(Employee.all, :country)
  end

  def country(name)
    employees = Employee.where(country: name)
    { country: name, **stats(employees), job_titles: grouped_stats(employees, :job_title) }
  end

  def job_title(country:, job_title:)
    {
      country:,
      job_title:,
      **stats(Employee.where(country:, job_title:)),
      country_average_salary: Employee.where(country:).pick(ROUNDED_AVERAGE),
      global_average_salary: Employee.where(job_title:).pick(ROUNDED_AVERAGE)
    }
  end

  private

  def stats(employees)
    AGGREGATES.keys.zip(employees.pick(*AGGREGATES.values)).to_h.merge(median_salary: median(employees))
  end

  def grouped_stats(employees, column)
    medians = ranked_salaries(employees, column).group(column).pluck(column, ROUNDED_AVERAGE).to_h

    employees.group(column).order(column).pluck(column, *AGGREGATES.values).map do |group, *values|
      { column => group, **AGGREGATES.keys.zip(values).to_h, median_salary: medians[group] }
    end
  end

  def median(employees)
    ranked_salaries(employees).pick(ROUNDED_AVERAGE)
  end

  def ranked_salaries(employees, partition_column = nil)
    partition = partition_column ? "PARTITION BY #{partition_column}" : ""
    ranked = employees.select(
      *partition_column, :salary,
      Arel.sql("ROW_NUMBER() OVER (#{partition} ORDER BY salary) AS position"),
      Arel.sql("COUNT(*) OVER (#{partition}) AS group_size")
    )

    Employee.from(ranked, :employees).where(MIDDLE_ROWS)
  end
end
