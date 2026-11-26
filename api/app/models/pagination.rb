class Pagination
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100

  attr_reader :page, :per_page

  def initialize(relation, page:, per_page:)
    @relation = relation
    @page = [ page.to_i, 1 ].max
    @per_page = (per_page.presence || DEFAULT_PER_PAGE).to_i.clamp(1, MAX_PER_PAGE)
  end

  def records
    @relation.limit(per_page).offset((page - 1) * per_page)
  end

  def meta
    { page:, per_page:, total_count:, total_pages: (total_count / per_page.to_f).ceil }
  end

  private

  def total_count
    @total_count ||= @relation.count
  end
end
