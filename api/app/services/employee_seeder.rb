class EmployeeSeeder
  class Error < StandardError; end

  DEFAULT_COUNT = 10_000
  BATCH_SIZE = 1_000
  RANDOM_SEED = 20_261_126
  NAMES_DIR = Rails.root.join("db/seeds")
  HIRE_DATES = Date.new(2011, 1, 1)..Date.new(2025, 12, 31)
  SALARY_SPREAD = 0.85..1.15

  COUNTRIES = {
    "United States" => { weight: 30, pay: 1.0 },
    "India" => { weight: 20, pay: 0.3 },
    "United Kingdom" => { weight: 10, pay: 0.8 },
    "Germany" => { weight: 10, pay: 0.85 },
    "Canada" => { weight: 8, pay: 0.8 },
    "France" => { weight: 6, pay: 0.75 },
    "Brazil" => { weight: 6, pay: 0.35 },
    "Australia" => { weight: 4, pay: 0.85 },
    "Japan" => { weight: 4, pay: 0.7 },
    "Singapore" => { weight: 2, pay: 0.9 }
  }.freeze

  ROLES = {
    "Engineering" => {
      "Software Engineer" => 95_000, "Senior Software Engineer" => 125_000,
      "Engineering Manager" => 150_000, "QA Engineer" => 75_000, "DevOps Engineer" => 105_000
    },
    "Finance" => { "Accountant" => 65_000, "Financial Analyst" => 75_000, "Finance Manager" => 115_000 },
    "Human Resources" => { "HR Generalist" => 60_000, "Recruiter" => 62_000, "HR Manager" => 100_000 },
    "Marketing" => { "Marketing Specialist" => 62_000, "Content Writer" => 55_000, "Marketing Manager" => 105_000 },
    "Operations" => { "Operations Analyst" => 63_000, "Project Manager" => 95_000, "Office Manager" => 55_000 },
    "Sales" => { "Sales Representative" => 58_000, "Account Executive" => 80_000, "Sales Manager" => 115_000 }
  }.freeze

  WEIGHTED_COUNTRIES = COUNTRIES.flat_map { |name, country| [ name ] * country[:weight] }.freeze
  ROLE_LIST = ROLES.flat_map { |department, titles| titles.map { |title, base| [ department, title, base ] } }.freeze

  def initialize(count: DEFAULT_COUNT,
                 first_names_path: NAMES_DIR.join("first_names.txt"),
                 last_names_path: NAMES_DIR.join("last_names.txt"))
    @count = count
    @first_names_path = first_names_path
    @last_names_path = last_names_path
  end

  def call
    batches = rows.each_slice(BATCH_SIZE)

    Employee.transaction do
      Employee.delete_all
      batches.each { |batch| Employee.insert_all!(batch) }
    end

    rows.size
  end

  def rows
    @rows ||= build_rows
  end

  private

  def build_rows
    first_names = read_names(@first_names_path)
    last_names = read_names(@last_names_path)
    random = Random.new(RANDOM_SEED)

    Array.new(@count) do |index|
      full_name = "#{first_names.sample(random:)} #{last_names.sample(random:)}"
      country = WEIGHTED_COUNTRIES.sample(random:)
      department, job_title, base_salary = ROLE_LIST.sample(random:)

      {
        full_name:,
        email: "#{full_name} #{index + 1}".parameterize(separator: ".") + "@example.com",
        country:,
        department:,
        job_title:,
        salary: salary_for(base_salary, country, random),
        hire_date: random.rand(HIRE_DATES)
      }
    end
  end

  def salary_for(base_salary, country, random)
    (base_salary * COUNTRIES.fetch(country)[:pay] * random.rand(SALARY_SPREAD) / 100).round * 100
  end

  def read_names(path)
    raise Error, "Names file not found: #{path}" unless File.exist?(path)

    names = File.readlines(path, chomp: true).map(&:squish).reject(&:empty?).uniq
    raise Error, "Names file is empty: #{path}" if names.empty?

    names
  end
end
