import React from 'react'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import {useNavigate, useParams} from 'react-router-dom'
import {Calendar, Modal} from '../../components'

import {useDispatch, useSelector, shallowEqual} from 'react-redux'
import {mainActions} from '../../actions/main.action'

import './Main.scss'

dayjs.extend(weekday)

function MainView(props) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {id: paramId} = useParams()

  const {recruitsData, monthlyRecruitData, dutiesData} = useSelector((state) => {
    return state['main.action']
  }, shallowEqual)

  const [selectedYearMonth, setSelectedYearMonth] = React.useState(dayjs())
  const [checkedRecruitList, setCheckedRecruitList] = React.useState(new Set())

  const [selectedRecruit, setSelectedRecruit] = React.useState(null)
  const [isShow, setShow] = React.useState(false)
  const [hasPrevRecruit, setPrevRecruit] = React.useState(false)
  const [hasNextRecruit, setNextRecruit] = React.useState(false)

  React.useEffect(() => {
    dispatch(mainActions.getRecruitsData())
    dispatch(mainActions.getDutiesData())
  }, [dispatch])

  React.useEffect(() => {
    if (recruitsData) {
      const firstDayOfMonth = dayjs(selectedYearMonth.format('YYYY-MM-01'))
      const lastDayOfMonth = dayjs(firstDayOfMonth.endOf('month').format('YYYY-MM-DD'))

      const startDate = firstDayOfMonth.weekday(0).format('YYYY-MM-DD HH:mm:ss') // 1일이 포함된 주의 일요일
      const endDate = lastDayOfMonth.weekday(6).endOf('day').format('YYYY-MM-DD HH:mm:ss') // 마지막 날이 포함된 주의 토요일

      dispatch(mainActions.getmonthlyRecruitData({startDate, endDate}))
    }
  }, [dispatch, recruitsData, selectedYearMonth])

  // paramId와 selectedRecruit 동기화
  React.useEffect(() => {
    if (paramId && monthlyRecruitData) {
      const recruitId = Number(paramId)
      const recruit = monthlyRecruitData.find((item) => item.id === recruitId)
      if (recruit) {
        setSelectedRecruit(recruit)
        setCheckedRecruitList((checkedRecruitList) => new Set(checkedRecruitList).add(recruitId))
      }
    }
  }, [paramId, monthlyRecruitData])

  React.useEffect(() => {
    if (selectedRecruit && monthlyRecruitData) {
      const currentIndex = getCurrentRecruitIndex()
      setPrevRecruit(currentIndex > 0)
      setNextRecruit(currentIndex < monthlyRecruitData.length - 1)
    }
  }, [selectedRecruit, monthlyRecruitData])

  const onRecruitClick = (event) => {
    setShow(true)
    setSelectedRecruit(event)
    navigate(`/${event.id}`)
  }

  const getCurrentRecruitIndex = () => {
    return monthlyRecruitData.findIndex((item) => item.id === selectedRecruit.id)
  }

  const navigateRecruit = (direction) => {
    if (selectedRecruit && monthlyRecruitData) {
      const currentIndex = getCurrentRecruitIndex()
      const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1

      if (newIndex >= 0 && newIndex < monthlyRecruitData.length) {
        const _recruit = monthlyRecruitData[newIndex]
        setSelectedRecruit(_recruit)
        navigate(`/${_recruit.id}`)
      }
    }
  }

  const onClose = () => {
    setShow(false)
    navigate('/')
  }

  const renderEvent = React.useCallback(
    (date, event) => {
      const isSameDate = date === dayjs(event[`${event.type}_time`]).format('YYYY-MM-DD')
      return (
        isSameDate && (
          <div
            key={`${event.id}-${event.type}`}
            className="flex flex_vertical_center gap_4"
            onClick={() => onRecruitClick(event)}>
            <div className={`calendar_label ${event.type} flex center`}>
              {event.type === 'start' ? '시' : '끝'}
            </div>
            <div className={checkedRecruitList.has(event.id) ? 'checked' : ''}>
              {event.company_name}
            </div>
          </div>
        )
      )
    },
    [onRecruitClick, checkedRecruitList],
  )

  const getDutiesLabelList = React.useCallback(
    (dutyIds = []) => {
      if (!dutyIds.length || !dutiesData.length) {
        return []
      }
      return dutiesData.filter((duty) => dutyIds.includes(duty.id)).map((duty) => duty.name)
    },
    [dutiesData],
  )

  return (
    <div className="main_container">
      <Calendar
        currentDate={selectedYearMonth}
        onChangeCurrentDate={setSelectedYearMonth}
        events={monthlyRecruitData}
        renderEvent={renderEvent}
      />
      {selectedRecruit && (
        <Modal
          isShow={isShow}
          onPrevClick={hasPrevRecruit ? () => navigateRecruit('prev') : null}
          onNextClick={hasNextRecruit ? () => navigateRecruit('next') : null}
          onClose={onClose}>
          <div className="modal_wrap">
            <div className="recruit_container">
              <div className="recruit_company_name">{selectedRecruit.company_name}</div>
              <div className="recruit_title">{selectedRecruit.title}</div>
              <div className="recruit_term">
                {selectedRecruit.start_time} ~ {selectedRecruit.end_time}
              </div>
              <div className="recruit_duties">
                {getDutiesLabelList(selectedRecruit.duty_ids).join(', ')}
              </div>
            </div>
            <img src={selectedRecruit.image_url} style={{maxWidth: '100%'}} />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MainView
